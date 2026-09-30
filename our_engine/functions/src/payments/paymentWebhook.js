/* ============================================================
   PAYMENT WEBHOOK — Cloud Function
   Receives Razorpay webhook, verifies HMAC signature,
   updates order paymentStatus.
   Frontend NEVER sets paymentStatus = PAID.
   ============================================================ */

const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { createAuditLog } = require('../utils/audit');
const crypto = require('crypto');
const { defineSecret } = require('firebase-functions/params');

const db = getFirestore();
const webhookSecret = defineSecret('RAZORPAY_WEBHOOK_SECRET');

exports.paymentWebhook = onRequest(
  { secrets: [webhookSecret] },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method not allowed');
    }

    // 1. Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret.value())
      .update(req.rawBody || JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    // 2. Process event
    const event = req.body.event;
    const payload = req.body.payload;

    try {
      switch (event) {
        case 'payment.captured':
        case 'order.paid': {
          const paymentEntity = payload.payment?.entity;
          if (!paymentEntity) break;

          const razorpayOrderId = paymentEntity.order_id;
          const razorpayPaymentId = paymentEntity.id;
          const tenantId = paymentEntity.notes?.tenantId;
          const orderId = paymentEntity.notes?.orderId;

          if (!tenantId || !orderId) {
            console.error('Missing tenantId or orderId in payment notes');
            break;
          }

          // Find payment record by gatewayOrderId
          const paymentsRef = db.collection('tenants').doc(tenantId).collection('payments');
          const paymentQuery = await paymentsRef.where('gatewayOrderId', '==', razorpayOrderId).limit(1).get();

          if (paymentQuery.empty) {
            console.error('Payment record not found for order:', razorpayOrderId);
            break;
          }

          const paymentDoc = paymentQuery.docs[0];

          // Idempotency: skip if already processed
          if (paymentDoc.data().status === 'PAID') {
            console.log('Payment already processed, skipping duplicate webhook');
            break;
          }

          const amount = paymentEntity.amount / 100; // Convert from paise

          // Update payment record
          await paymentDoc.ref.update({
            status: 'PAID',
            gatewayPaymentId: razorpayPaymentId,
            paidAmount: amount,
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Update order
          const orderRef = db.collection('tenants').doc(tenantId).collection('orders').doc(orderId);
          await orderRef.update({
            paymentStatus: 'PAID',
            'payment.paidAmount': amount,
            'payment.remainingAmount': amount,
            paidAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Audit log
          await createAuditLog({
            tenantId,
            actorUid: 'SYSTEM',
            actorRole: 'SYSTEM',
            action: 'PAYMENT_CONFIRMED',
            entityType: 'ORDER',
            entityId: orderId,
            metadata: { razorpayPaymentId, amount },
            previousState: 'PENDING',
            newState: 'PAID',
          });

          break;
        }

        case 'payment.failed': {
          const paymentEntity = payload.payment?.entity;
          if (!paymentEntity) break;

          const tenantId = paymentEntity.notes?.tenantId;
          const orderId = paymentEntity.notes?.orderId;
          const razorpayOrderId = paymentEntity.order_id;

          if (!tenantId || !orderId) break;

          const paymentsRef = db.collection('tenants').doc(tenantId).collection('payments');
          const paymentQuery = await paymentsRef.where('gatewayOrderId', '==', razorpayOrderId).limit(1).get();

          if (!paymentQuery.empty) {
            await paymentQuery.docs[0].ref.update({
              status: 'FAILED',
              updatedAt: FieldValue.serverTimestamp(),
            });
          }

          const orderRef = db.collection('tenants').doc(tenantId).collection('orders').doc(orderId);
          await orderRef.update({
            paymentStatus: 'FAILED',
            updatedAt: FieldValue.serverTimestamp(),
          });

          break;
        }

        default:
          console.log('Unhandled webhook event:', event);
      }

      return res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook processing error:', err);
      return res.status(500).send('Internal error');
    }
  }
);
