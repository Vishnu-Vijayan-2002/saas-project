/* ============================================================
   FORGOT PASSWORD PAGE
   ============================================================ */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-card__logo">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--color-accent), hsl(260, 80%, 55%))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: 'white',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            O
          </div>
        </div>

        {sent ? (
          <>
            <h1 className="auth-card__title">Check your email</h1>
            <p className="auth-card__subtitle">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Link to="/login" className="btn btn-secondary w-full" style={{ marginTop: 'var(--space-4)' }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-card__title">Reset password</h1>
            <p className="auth-card__subtitle">
              Enter your email and we'll send you a reset link
            </p>

            {error && (
              <div
                style={{
                  background: 'var(--color-error-bg)',
                  border: '1px solid hsla(0, 84%, 60%, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  marginBottom: 'var(--space-4)',
                  color: 'var(--color-error)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
              <Link to="/login" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                ← Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
