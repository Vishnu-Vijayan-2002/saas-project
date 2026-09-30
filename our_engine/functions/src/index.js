/* ============================================================
   CLOUD FUNCTIONS — Entry point
   Exports all Cloud Functions for the platform.
   ============================================================ */

const { initializeApp } = require('firebase-admin/app');

// Initialize Firebase Admin SDK
initializeApp();

// ---- AUTH FUNCTIONS ----
const { createTenantUser } = require('./auth/userFunctions');
exports.createTenantUser = createTenantUser;

// ---- ORDER FUNCTIONS ----
const { createOrder } = require('./orders/createOrder');
const { updateOrderStatus } = require('./orders/updateOrder');
const { cancelOrder } = require('./orders/cancelOrder');
const { assignSalesman } = require('./orders/assignSalesman');
exports.createOrder = createOrder;
exports.updateOrderStatus = updateOrderStatus;
exports.cancelOrder = cancelOrder;
exports.assignSalesman = assignSalesman;

// ---- PAYMENT FUNCTIONS ----
const { createPayment } = require('./payments/createPayment');
const { paymentWebhook } = require('./payments/paymentWebhook');
const { verifyPayment } = require('./payments/verifyPayment');
exports.createPayment = createPayment;
exports.paymentWebhook = paymentWebhook;
exports.verifyPayment = verifyPayment;

// ---- REFUND FUNCTIONS ----
const { createRefund } = require('./refunds/createRefund');
const { refundWebhook } = require('./refunds/refundWebhook');
exports.createRefund = createRefund;
exports.refundWebhook = refundWebhook;

// ---- SALESMAN FUNCTIONS ----
const { updateDeliveryStatus } = require('./salesman/updateDeliveryStatus');
exports.updateDeliveryStatus = updateDeliveryStatus;

// ---- WHATSAPP FUNCTIONS ----
const { sendWhatsAppMessage } = require('./whatsapp/sendMessage');
const { whatsappWebhook } = require('./whatsapp/webhook');
exports.sendWhatsAppMessage = sendWhatsAppMessage;
exports.whatsappWebhook = whatsappWebhook;

// ---- CAMPAIGN FUNCTIONS ----
const { executeCampaign } = require('./campaigns/executeCampaign');
exports.executeCampaign = executeCampaign;

// ---- TENANT FUNCTIONS ----
const { createTenant } = require('./tenants/createTenant');
const { updateTenant } = require('./tenants/updateTenant');
exports.createTenant = createTenant;
exports.updateTenant = updateTenant;
