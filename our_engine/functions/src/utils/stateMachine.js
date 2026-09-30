/* ============================================================
   CLOUD FUNCTIONS — State machine (server-side)
   Same logic as frontend, enforced on the backend.
   ============================================================ */

const { HttpsError } = require('firebase-functions/v2/https');

const ORDER_STATES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
};

const PAYMENT_STATES = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  REFUNDED: 'REFUNDED',
};

const DELIVERY_STATES = {
  NOT_DELIVERED: 'NOT_DELIVERED',
  DELIVERED: 'DELIVERED',
};

const ORDER_TRANSITIONS = {
  [ORDER_STATES.PENDING]: [ORDER_STATES.CONFIRMED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.CONFIRMED]: [ORDER_STATES.PREPARING, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PREPARING]: [ORDER_STATES.READY_FOR_DELIVERY, ORDER_STATES.CANCELLED],
  [ORDER_STATES.READY_FOR_DELIVERY]: [ORDER_STATES.COMPLETED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.CANCELLED]: [],
  [ORDER_STATES.COMPLETED]: [],
};

const PAYMENT_TRANSITIONS = {
  [PAYMENT_STATES.PENDING]: [PAYMENT_STATES.PAID, PAYMENT_STATES.FAILED],
  [PAYMENT_STATES.PAID]: [PAYMENT_STATES.PARTIALLY_REFUNDED, PAYMENT_STATES.REFUNDED],
  [PAYMENT_STATES.FAILED]: [PAYMENT_STATES.PAID],
  [PAYMENT_STATES.PARTIALLY_REFUNDED]: [PAYMENT_STATES.PARTIALLY_REFUNDED, PAYMENT_STATES.REFUNDED],
  [PAYMENT_STATES.REFUNDED]: [],
};

function canTransitionOrderStatus(current, next) {
  const valid = ORDER_TRANSITIONS[current];
  if (!valid) return false;
  return valid.includes(next);
}

function canTransitionPaymentStatus(current, next) {
  const valid = PAYMENT_TRANSITIONS[current];
  if (!valid) return false;
  return valid.includes(next);
}

function validateOrderTransition(current, next) {
  if (!canTransitionOrderStatus(current, next)) {
    throw new HttpsError(
      'failed-precondition',
      `Cannot transition order from ${current} to ${next}.`
    );
  }
}

function validatePaymentTransition(current, next) {
  if (!canTransitionPaymentStatus(current, next)) {
    throw new HttpsError(
      'failed-precondition',
      `Cannot transition payment from ${current} to ${next}.`
    );
  }
}

function canCancelOrder(order) {
  if (order.orderStatus === ORDER_STATES.COMPLETED) {
    return { allowed: false, reason: 'Completed orders cannot be cancelled' };
  }
  if (order.orderStatus === ORDER_STATES.CANCELLED) {
    return { allowed: false, reason: 'Order is already cancelled' };
  }
  if (order.deliveryStatus === DELIVERY_STATES.DELIVERED) {
    return { allowed: false, reason: 'Delivered orders cannot be cancelled' };
  }
  return { allowed: true, reason: null };
}

function isEligibleForSalesmanDelivery(order, salesman) {
  return (
    order.tenantId === salesman.tenantId &&
    order.assignedSalesmanId === salesman.uid &&
    order.paymentStatus === PAYMENT_STATES.PAID &&
    order.orderStatus === ORDER_STATES.READY_FOR_DELIVERY &&
    order.deliveryStatus === DELIVERY_STATES.NOT_DELIVERED
  );
}

function calculatePaymentStatusAfterRefund(paidAmount, totalRefunded) {
  if (totalRefunded >= paidAmount) return PAYMENT_STATES.REFUNDED;
  if (totalRefunded > 0) return PAYMENT_STATES.PARTIALLY_REFUNDED;
  return PAYMENT_STATES.PAID;
}

module.exports = {
  ORDER_STATES,
  PAYMENT_STATES,
  DELIVERY_STATES,
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
  validateOrderTransition,
  validatePaymentTransition,
  canCancelOrder,
  isEligibleForSalesmanDelivery,
  calculatePaymentStatusAfterRefund,
};
