/* ============================================================
   CREATE ORDER — Cloud Function
   Validates input, checks inventory, creates order + payment.
   ============================================================ */

const { onCall } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { verifyAuth, requireTenant } = require('../utils/auth');
const { checkIdempotency, completeIdempotency, failIdempotency } = require('../utils/idempotency');
const { createAuditLog } = require('../utils/audit');
const { ORDER_STATES, PAYMENT_STATES, DELIVERY_STATES } = require('../utils/stateMachine');

const db = getFirestore();

exports.createOrder = onCall(async (request) => {
  // 1. Authenticate
  const user = await verifyAuth(request);

  const { tenantId, items, customer, idempotencyKey } = request.data;

  if (!tenantId || !items || !Array.isArray(items) || items.length === 0) {
    throw new (require('firebase-functions/v2/https').HttpsError)(
      'invalid-argument',
      'Missing required fields: tenantId, items'
    );
  }

  // 2. Check idempotency
  await checkIdempotency(idempotencyKey, 'CREATE_ORDER', { tenantId });

  try {
    // 3. Verify tenant exists and is active
    const tenantRef = db.collection('tenants').doc(tenantId);
    const tenantSnap = await tenantRef.get();
    if (!tenantSnap.exists || tenantSnap.data().status !== 'ACTIVE') {
      throw new (require('firebase-functions/v2/https').HttpsError)(
        'not-found',
        'Business not found or is inactive.'
      );
    }

    // 4. Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const productRef = db.collection('tenants').doc(tenantId).collection('products').doc(item.productId);
      const productSnap = await productRef.get();

      if (!productSnap.exists || productSnap.data().status !== 'ACTIVE') {
        throw new (require('firebase-functions/v2/https').HttpsError)(
          'not-found',
          `Product ${item.productId} not found or inactive.`
        );
      }

      const product = productSnap.data();

      // Check stock
      if (product.stock !== undefined && product.stock < item.quantity) {
        throw new (require('firebase-functions/v2/https').HttpsError)(
          'failed-precondition',
          `Insufficient stock for ${product.name}. Available: ${product.stock}`
        );
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: item.productId,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
      });
    }

    const total = subtotal; // Add tax/discount logic if needed

    // 5. Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // 6. Create order document
    const orderRef = db.collection('tenants').doc(tenantId).collection('orders').doc();
    const orderData = {
      tenantId,
      orderId: orderRef.id,
      orderNumber,
      customerId: user.uid,
      customer: {
        name: customer?.name || user.email?.split('@')[0] || 'Customer',
        phone: customer?.phone || '',
      },
      items: orderItems,
      subtotal,
      tax: 0,
      discount: 0,
      total,
      paymentStatus: PAYMENT_STATES.PENDING,
      payment: {
        amount: total,
        paidAmount: 0,
        refundedAmount: 0,
        remainingAmount: total,
        currency: 'INR',
      },
      orderStatus: ORDER_STATES.PENDING,
      deliveryStatus: DELIVERY_STATES.NOT_DELIVERED,
      assignedSalesmanId: null,
      createdAt: FieldValue.serverTimestamp(),
      paidAt: null,
      readyAt: null,
      deliveredAt: null,
      deliveredBy: null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 7. Write order and decrement inventory in a batch
    const batch = db.batch();
    batch.set(orderRef, orderData);

    // Decrement stock for each item
    for (const item of orderItems) {
      const productRef = db.collection('tenants').doc(tenantId).collection('products').doc(item.productId);
      batch.update(productRef, {
        stock: FieldValue.increment(-item.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    // 8. Audit log
    await createAuditLog({
      tenantId,
      actorUid: user.uid,
      actorRole: user.role || 'CUSTOMER',
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: orderRef.id,
      metadata: { orderNumber, total, itemCount: orderItems.length },
      newState: ORDER_STATES.PENDING,
    });

    // 9. Complete idempotency
    await completeIdempotency(idempotencyKey, { orderId: orderRef.id, orderNumber });

    return { orderId: orderRef.id, orderNumber, total };
  } catch (err) {
    await failIdempotency(idempotencyKey, err);
    throw err;
  }
});
