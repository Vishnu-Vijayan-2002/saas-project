/* ============================================================
   VALIDATORS — Input validation helpers
   ============================================================ */

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian phone number (with or without +91).
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate a positive number.
 * @param {number} value
 * @returns {boolean}
 */
export function isPositiveNumber(value) {
  return typeof value === 'number' && value > 0 && isFinite(value);
}

/**
 * Validate a non-negative number.
 * @param {number} value
 * @returns {boolean}
 */
export function isNonNegativeNumber(value) {
  return typeof value === 'number' && value >= 0 && isFinite(value);
}

/**
 * Validate a non-empty trimmed string.
 * @param {string} str
 * @returns {boolean}
 */
export function isNonEmptyString(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

/**
 * Validate required fields in an object.
 * @param {object} data - Data to validate
 * @param {string[]} requiredFields - List of required field names
 * @returns {{ valid: boolean, missingFields: string[] }}
 */
export function validateRequired(data, requiredFields) {
  const missingFields = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ''
  );
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate order items array.
 * @param {Array} items - Array of order items
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: 'Order must contain at least one item' };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.productId) {
      return { valid: false, error: `Item ${i + 1}: missing product ID` };
    }
    if (!isPositiveNumber(item.quantity)) {
      return { valid: false, error: `Item ${i + 1}: quantity must be a positive number` };
    }
    if (!isNonNegativeNumber(item.unitPrice)) {
      return { valid: false, error: `Item ${i + 1}: unit price must be a valid number` };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validate refund amount.
 * @param {number} refundAmount - Requested refund amount
 * @param {number} paidAmount - Total paid amount
 * @param {number} refundedAmount - Already refunded amount
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateRefundAmount(refundAmount, paidAmount, refundedAmount) {
  if (!isPositiveNumber(refundAmount)) {
    return { valid: false, error: 'Refund amount must be a positive number' };
  }

  const remainingRefundable = paidAmount - refundedAmount;

  if (refundAmount > remainingRefundable) {
    return {
      valid: false,
      error: `Refund amount (${refundAmount}) exceeds refundable balance (${remainingRefundable})`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Sanitize string input to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
