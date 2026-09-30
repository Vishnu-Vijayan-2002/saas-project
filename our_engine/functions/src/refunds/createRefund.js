/* ============================================================
   CREATE REFUND — Cloud Function
   Validates, calls Razorpay refund API, creates refund record.
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { verifyAuth, requireRole, requireTenant } = require('../utils/auth');
const { checkIdempotency, completeIdempotency, failIdempotency } = require('../utils/idempotency');
const { createAuditLog } = require('../utils/audit');
const { calculatePaymentStatusAfterRefund, PAYMENT_STATES } = require('../utils/stateMachine');
const Razorpay = require('razorpay');
const { defineSecret } = require('firebase-functions/params');

const db = getFirestore();
const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID');
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET');

exports.createRefund = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    const user = await verifyAuth(request);
    requireRole(user, ['BUSINESS_ADMIN', 'SUPER_ADMIN']);

    const { tenantId, orderId, amount, reason, idempotencyKey } = request.data;

    if (!tenantId || !orderId || !amount || !idempotencyKey) {
      throw new HttpsError('invalid-argument', 'Missing required fields.');
    }

    requireTenant(user, tenantId);

    // Idempotency check
    await checkIdempotency(idempotencyKey, 'CREATE_REFUND', { tenantId, orderId });

    try {
      // Get order
      const orderRef = db.collection('tenants').doc(tenantId).collection('orders').doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        throw new HttpsError('not-found', 'Order not found.');
      }

      const order = orderSnap.data();

      // Validate payment status
      if (![PAYMENT_STATES.PAID, PAYMENT_STATES.PARTIALLY_REFUNDED].includes(order.paymentStatus)) {
        throw new HttpsError('failed-precondition', 'Payment is not eligible for refund.');
      }

      // Validate refund amount
      const paidAmount = order.payment?.paidAmount || 0;
      const refundedAmount = order.payment?.refundedAmount || 0;
      const remainingRefundable = paidAmount - refundedAmount;

      if (amount <= 0) {
        throw new HttpsError('invalid-argument', 'Refund amount must be positive.');
      }

      if (amount > remainingRefundable) {
        throw new HttpsError(
          'failed-precondition',
          `Refund amount (${amount}) exceeds refundable balance (${remainingRefundable}).`
        );
      }

      // Find the payment record to get Razorpay payment ID
      const paymentsRef = db.collection('tenants').doc(tenantId).collection('payments');
      const paymentQuery = await paymentsRef.where('orderId', '==', orderId).where('status', '==', 'PAID').limit(1).get();

      if (paymentQuery.empty) {
        throw new HttpsError('not-found', 'Payment record not found.');
      }

      const paymentDoc = paymentQuery.docs[0];
      const paymentData = paymentDoc.data();

      // Call Razorpay refund API
      const razorpay = new Razorpay({
        key_id: razorpayKeyId.value(),
        key_secret: razorpayKeySecret.value(),
      });

      const refundResponse = await razorpay.payments.refund(paymentData.gatewayPaymentId, {
        amount: Math.round(amount * 100), // paise
        notes: {
          tenantId,
          orderId,
          reason,
        },
      });

      // Calculate new totals
      const newRefundedAmount = refundedAmount + amount;
      const newRemainingAmount = paidAmount - newRefundedAmount;
      const newPaymentStatus = calculatePaymentStatusAfterRefund(paidAmount, newRefundedAmount);
      const refundType = newRefundedAmount >= paidAmount ? 'FULL' : 'PARTIAL';

      // Create refund record
      const refundRef = db.collection('tenants').doc(tenantId).collection('refunds').doc();
      await refundRef.set({
        tenantId,
        orderId,
        paymentId: paymentDoc.id,
        amount,
        currency: 'INR',
        type: refundType,
        reason: reason || 'OTHER',
        status: 'COMPLETED',
        gatewayRefundId: refundResponse.id,
        createdBy: user.uid,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Update order payment status
      await orderRef.update({
        paymentStatus: newPaymentStatus,
        'payment.refundedAmount': newRefundedAmount,
        'payment.remainingAmount': newRemainingAmount,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Audit log
      const auditAction = refundType === 'FULL' ? 'REFUND_COMPLETED' : 'PARTIAL_REFUND_COMPLETED';
      await createAuditLog({
        tenantId,
        actorUid: user.uid,
        actorRole: user.role,
        action: auditAction,
        entityType: 'ORDER',
        entityId: orderId,
        metadata: { amount, refundType, gatewayRefundId: refundResponse.id },
        previousState: order.paymentStatus,
        newState: newPaymentStatus,
        reason,
      });

      await completeIdempotency(idempotencyKey, { refundId: refundRef.id, amount, type: refundType });

      return {
        success: true,
        refundId: refundRef.id,
        amount,
        type: refundType,
        newPaymentStatus,
      };
    } catch (err) {
      await failIdempotency(idempotencyKey, err);
      throw err;
    }
  }
);
