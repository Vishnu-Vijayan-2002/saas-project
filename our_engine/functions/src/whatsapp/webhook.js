/* ============================================================
   WHATSAPP WEBHOOK — Meta Cloud API Webhook Listener
   Handles webhook handshake challenge verification and inbound notifications.
   ============================================================ */

const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

exports.whatsappWebhook = onRequest(async (req, res) => {
  // 1. Meta Webhook Verification Handshake (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'our_engine_whatsapp_verify_token';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp Webhook verified successfully');
      res.status(200).send(challenge);
      return;
    } else {
      console.warn('WhatsApp Webhook verification failed. Token mismatch.');
      res.status(403).send('Forbidden');
      return;
    }
  }

  // 2. Inbound event listener (POST)
  if (req.method === 'POST') {
    const body = req.body;

    try {
      if (body.object === 'whatsapp_business_account') {
        const entries = body.entry || [];

        for (const entry of entries) {
          const changes = entry.changes || [];

          for (const change of changes) {
            const value = change.value;
            if (!value) continue;

            // Handle status updates (sent, delivered, read, failed)
            if (value.statuses && Array.isArray(value.statuses)) {
              for (const statusObj of value.statuses) {
                const messageId = statusObj.id;
                const status = statusObj.status; // sent, delivered, read, failed
                const recipientId = statusObj.recipient_id;

                // Log or update status in collectionGroup
                console.log(`WhatsApp message status update: ${messageId} -> ${status}`);
              }
            }

            // Handle incoming customer replies
            if (value.messages && Array.isArray(value.messages)) {
              for (const message of value.messages) {
                const from = message.from;
                const msgType = message.type;
                const text = message.text?.body || '';

                console.log(`Inbound WhatsApp message from ${from}: ${text} (${msgType})`);
              }
            }
          }
        }

        // Return 200 OK immediately as required by Meta webhook contract
        res.status(200).send('EVENT_RECEIVED');
        return;
      }

      res.status(404).send('Not Found');
    } catch (err) {
      console.error('Error handling WhatsApp webhook event:', err);
      // Always return 200 to Meta to prevent retry loops on bad payloads
      res.status(200).send('EVENT_RECEIVED');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
});
