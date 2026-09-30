/* ============================================================
   REFUND WEBHOOK — Cloud Function
   Receives Razorpay refund webhook, verifies, updates status.
   ============================================================ */

const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { createAuditLog } = require('../utils/audit');
const { calculatePaymentStatusAfterRefund } = require('../utils/stateMachine');
const crypto = require('crypto');
const { defineSecret } = require('firebase-functions/params');

const db = getFirestore();
const webhookSecret = defineSecret('RAZORPAY_WEBHOOK_SECRET');

exports.refundWebhook = onRequest(
  { secrets: [webhookSecret] },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method not allowed');
    }

    // Verify signature
    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret.value())
      .update(req.rawBody || JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    try {
      if (event === 'refund.processed' || event === 'refund.created') {
        const refundEntity = payload.refund?.entity;
        if (!refundEntity) return res.status(200).send('OK');

        const tenantId = refundEntity.notes?.tenantId;
        const orderId = refundEntity.notes?.orderId;

        if (!tenantId || !orderId) {
          console.error('Missing tenant/order in refund notes');
          return res.status(200).send('OK');
        }

        // Update the refund record if it exists
        const refundsRef = db.collection('tenants').doc(tenantId).collection('refunds');
        const refundQuery = await refundsRef.where('gatewayRefundId', '==', refundEntity.id).limit(1).get();

        if (!refundQuery.empty) {
          await refundQuery.docs[0].ref.update({
            status: 'COMPLETED',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        console.log(`Refund webhook processed for order ${orderId}`);
      }

      return res.status(200).send('OK');
    } catch (err) {
      console.error('Refund webhook error:', err);
      return res.status(500).send('Internal error');
    }
  }
);
