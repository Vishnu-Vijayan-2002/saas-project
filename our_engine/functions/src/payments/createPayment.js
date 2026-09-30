/* ============================================================
   CREATE PAYMENT — Cloud Function
   Creates a Razorpay order and returns it to the frontend.
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { verifyAuth, requireTenant } = require('../utils/auth');
const Razorpay = require('razorpay');
const { defineSecret } = require('firebase-functions/params');

const db = getFirestore();

// Secrets
const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID');
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET');

exports.createPayment = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    const user = await verifyAuth(request);

    const { tenantId, orderId } = request.data;

    if (!tenantId || !orderId) {
      throw new HttpsError('invalid-argument', 'Missing required fields.');
    }

    // Get the order
    const orderRef = db.collection('tenants').doc(tenantId).collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }

    const order = orderSnap.data();

    // Verify the customer owns this order
    if (order.customerId !== user.uid && user.role !== 'BUSINESS_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new HttpsError('permission-denied', 'Access denied.');
    }

    if (order.paymentStatus !== 'PENDING') {
      throw new HttpsError('failed-precondition', 'Payment is not in pending state.');
    }

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: razorpayKeyId.value(),
      key_secret: razorpayKeySecret.value(),
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: orderId,
      notes: {
        tenantId,
        orderId,
        customerId: user.uid,
      },
    });

    // Store payment record
    const paymentRef = db.collection('tenants').doc(tenantId).collection('payments').doc();
    await paymentRef.set({
      tenantId,
      orderId,
      amount: order.total,
      currency: 'INR',
      status: 'PENDING',
      gateway: 'RAZORPAY',
      gatewayOrderId: razorpayOrder.id,
      gatewayPaymentId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      paymentId: paymentRef.id,
    };
  }
);
