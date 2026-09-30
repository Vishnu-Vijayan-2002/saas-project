/* ============================================================
   VERIFY PAYMENT — Cloud Function
   Secondary server-side verification after Razorpay checkout.
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const { verifyAuth } = require('../utils/auth');
const crypto = require('crypto');
const { defineSecret } = require('firebase-functions/params');

const db = getFirestore();
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET');

exports.verifyPayment = onCall(
  { secrets: [razorpayKeySecret] },
  async (request) => {
    await verifyAuth(request);

    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, tenantId, orderId } = request.data;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      throw new HttpsError('invalid-argument', 'Missing payment verification data.');
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret.value())
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new HttpsError('unauthenticated', 'Payment verification failed. Invalid signature.');
    }

    // Payment is verified — the webhook should have already updated the status.
    // This is a double-check. If webhook hasn't processed yet, we wait.
    return {
      verified: true,
      message: 'Payment verified successfully.',
    };
  }
);
