/* ============================================================
   TOAST CONTEXT — Global toast notification system
   ============================================================ */

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message, duration = 5000) => {
    const id = ++toastIdCounter;
    const toast = { id, type, title, message };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title, message) => {
    if (!message && title) return addToast('success', title);
    return addToast('success', title, message);
  }, [addToast]);

  const error = useCallback((title, message) => {
    if (!message && title) return addToast('error', title);
    return addToast('error', title, message);
  }, [addToast]);

  const warning = useCallback((title, message) => {
    if (!message && title) return addToast('warning', title);
    return addToast('warning', title, message);
  }, [addToast]);

  const info = useCallback((title, message) => {
    if (!message && title) return addToast('info', title);
    return addToast('info', title, message);
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
        showSuccess: success,
        showError: error,
        showWarning: warning,
        showInfo: info,
      }}
    >
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
              </div>
              <button
                className="toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
