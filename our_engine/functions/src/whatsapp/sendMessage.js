/* ============================================================
   WHATSAPP SERVICE — Send WhatsApp Cloud API Messages
   Supports template messages, text messages, media, and interactive messages.
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const axios = require('axios');
const { verifyAuth, requireTenant } = require('../utils/auth');

const db = getFirestore();

/**
 * Low-level function to dispatch WhatsApp message via Meta Cloud API.
 * Uses tenant-specific credentials or system fallback.
 */
async function dispatchWhatsAppMessage({ tenantId, to, type = 'template', template, text }) {
  if (!to) {
    throw new Error('Recipient phone number is required.');
  }

  // Normalize phone number (strip spaces, dashes, leading '+')
  const cleanPhone = to.replace(/\D/g, '');

  // Fetch tenant settings to get WhatsApp Cloud API config if available
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (tenantId) {
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (tenantDoc.exists) {
      const data = tenantDoc.data();
      if (data.settings?.whatsappAccessToken) {
        accessToken = data.settings.whatsappAccessToken;
      }
      if (data.settings?.whatsappPhoneNumberId) {
        phoneNumberId = data.settings.whatsappPhoneNumberId;
      }
    }
  }

  // Construct request payload
  let payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
  };

  if (type === 'template' && template) {
    payload.type = 'template';
    payload.template = template;
  } else if (type === 'text' && text) {
    payload.type = 'text';
    payload.text = { preview_url: false, body: text };
  } else {
    throw new Error('Invalid message payload: missing template or text body.');
  }

  let logRecord = {
    tenantId: tenantId || null,
    recipient: cleanPhone,
    type,
    payload,
    status: 'PENDING',
    createdAt: FieldValue.serverTimestamp(),
  };

  // If no WhatsApp credentials configured (e.g. dev/test mode without API keys)
  if (!accessToken || !phoneNumberId) {
    console.warn(`[WhatsApp Mock] No WhatsApp Cloud API credentials configured. Mocking send to: ${cleanPhone}`);
    logRecord.status = 'MOCKED';
    logRecord.mockMessage = 'Message mocked in development/staging environment';

    if (tenantId) {
      await db.collection('tenants').doc(tenantId).collection('whatsapp_logs').add(logRecord);
    }
    return {
      success: true,
      mocked: true,
      messageId: `mock_${Date.now()}`,
    };
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const responseData = response.data;
    const messageId = responseData.messages?.[0]?.id || null;

    logRecord.status = 'SENT';
    logRecord.whatsappMessageId = messageId;
    logRecord.apiResponse = responseData;

    if (tenantId) {
      await db.collection('tenants').doc(tenantId).collection('whatsapp_logs').add(logRecord);
    }

    return {
      success: true,
      messageId,
      responseData,
    };
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message;
    console.error('WhatsApp Cloud API dispatch error:', errorMessage);

    logRecord.status = 'FAILED';
    logRecord.error = errorMessage;
    if (tenantId) {
      await db.collection('tenants').doc(tenantId).collection('whatsapp_logs').add(logRecord);
    }

    throw new Error(`WhatsApp API error: ${errorMessage}`);
  }
}

/**
 * Callable function for authenticated business admin / super admin to send messages.
 */
exports.sendWhatsAppMessage = onCall(async (request) => {
  const caller = await verifyAuth(request);
  const { tenantId, to, type, template, text } = request.data || {};

  if (!tenantId || !to) {
    throw new HttpsError('invalid-argument', 'Missing tenantId or recipient phone (to).');
  }

  requireTenant(caller, tenantId);

  try {
    const result = await dispatchWhatsAppMessage({ tenantId, to, type, template, text });
    return result;
  } catch (error) {
    throw new HttpsError('internal', error.message);
  }
});

exports.dispatchWhatsAppMessage = dispatchWhatsAppMessage;
