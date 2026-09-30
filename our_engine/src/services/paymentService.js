/* ============================================================
   PAYMENT SERVICE — Payment operations via Cloud Functions
   ============================================================ */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../app/firebase';

/**
 * Initiate payment via Cloud Function.
 * Creates a Razorpay order and returns the order_id for frontend checkout.
 * Frontend NEVER sets paymentStatus = PAID.
 * @param {object} params - { tenantId, orderId }
 */
export async function initiatePayment(params) {
  const fn = httpsCallable(functions, 'createPayment');
  return fn(params);
}

/**
 * Verify payment after Razorpay checkout callback.
 * Sends the payment response to Cloud Function for server-side verification.
 * @param {object} params - { tenantId, orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature }
 */
export async function verifyPayment(params) {
  const fn = httpsCallable(functions, 'verifyPayment');
  return fn(params);
}

/**
 * Load Razorpay checkout script.
 * @returns {Promise<boolean>}
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay checkout modal.
 * @param {object} options - Razorpay checkout options
 * @returns {Promise<object>} - Payment response
 */
export function openRazorpayCheckout(options) {
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled by user')),
      },
    });
    rzp.open();
  });
}
