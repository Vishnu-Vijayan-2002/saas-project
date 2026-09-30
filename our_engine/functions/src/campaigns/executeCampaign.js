/* ============================================================
   EXECUTE CAMPAIGN — Cloud Function
   Executes a marketing campaign or movie promotion via WhatsApp.
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { verifyAuth, requireTenant, requireRole } = require('../utils/auth');
const { createAuditLog } = require('../utils/audit');
const { dispatchWhatsAppMessage } = require('../whatsapp/sendMessage');

const db = getFirestore();

exports.executeCampaign = onCall(async (request) => {
  const caller = await verifyAuth(request);
  requireRole(caller, ['BUSINESS_ADMIN', 'SUPER_ADMIN']);

  const { tenantId, campaignId } = request.data || {};

  if (!tenantId || !campaignId) {
    throw new HttpsError('invalid-argument', 'Missing tenantId or campaignId.');
  }

  requireTenant(caller, tenantId);

  const campaignRef = db.collection('tenants').doc(tenantId).collection('campaigns').doc(campaignId);
  const campaignSnap = await campaignRef.get();

  if (!campaignSnap.exists) {
    throw new HttpsError('not-found', 'Campaign not found.');
  }

  const campaign = campaignSnap.data();

  if (['COMPLETED', 'RUNNING'].includes(campaign.status)) {
    throw new HttpsError('failed-precondition', `Campaign is already ${campaign.status}.`);
  }

  // Set status to RUNNING
  await campaignRef.update({
    status: 'RUNNING',
    startedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    // 1. Gather recipient phone numbers
    let recipientPhones = [];

    if (Array.isArray(campaign.targetRecipients) && campaign.targetRecipients.length > 0) {
      recipientPhones = campaign.targetRecipients;
    } else {
      // Query tenant customers
      const customersSnap = await db
        .collection('tenants')
        .doc(tenantId)
        .collection('customers')
        .limit(500)
        .get();

      recipientPhones = customersSnap.docs
        .map((d) => d.data().phone)
        .filter((phone) => phone && phone.trim().length >= 10);
    }

    // Deduplicate
    recipientPhones = [...new Set(recipientPhones)];

    let sentCount = 0;
    let failedCount = 0;

    // 2. Dispatch messages
    for (const phone of recipientPhones) {
      try {
        await dispatchWhatsAppMessage({
          tenantId,
          to: phone,
          type: campaign.templateName ? 'template' : 'text',
          template: campaign.templateName
            ? {
                name: campaign.templateName,
                language: { code: campaign.templateLanguage || 'en' },
              }
            : undefined,
          text: campaign.messageBody || campaign.description || `Special offer from ${tenantId}`,
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send campaign message to ${phone}:`, err.message);
        failedCount++;
      }
    }

    // 3. Update campaign stats
    await campaignRef.update({
      status: 'COMPLETED',
      sentCount,
      failedCount,
      totalRecipients: recipientPhones.length,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 4. Audit log
    await createAuditLog({
      tenantId,
      action: 'CAMPAIGN_EXECUTED',
      actorId: caller.uid,
      actorRole: caller.role,
      resourceType: 'campaigns',
      resourceId: campaignId,
      details: {
        campaignName: campaign.name || campaign.title,
        totalRecipients: recipientPhones.length,
        sentCount,
        failedCount,
      },
    });

    return {
      success: true,
      campaignId,
      totalRecipients: recipientPhones.length,
      sentCount,
      failedCount,
    };
  } catch (error) {
    console.error('Error executing campaign:', error);
    await campaignRef.update({
      status: 'FAILED',
      errorMessage: error.message,
      updatedAt: FieldValue.serverTimestamp(),
    });
    throw new HttpsError('internal', error.message || 'Campaign execution failed.');
  }
});
