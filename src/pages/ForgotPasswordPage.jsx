import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate sending password reset email
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="auth-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="auth-side-form" style={{ width: '100%', maxWidth: '480px' }}>
        <div className="auth-card" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link to="/" className="auth-brand-logo" style={{ display: 'inline-flex', marginBottom: '1.25rem' }}>
              <div className="logo-icon">
                <UtensilsCrossed size={22} />
              </div>
              <span className="logo-text">Dine<span>Flow</span></span>
            </Link>

            <h2 className="auth-card-title">Reset password</h2>
            <p className="auth-card-subtitle">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Check your email</h3>
              <p style={{ color: '#a8afc4', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                We've sent a password reset link to <strong style={{ color: '#ffffff' }}>{email}</strong> if an account exists with that address.
              </p>
              <Link to="/login" className="auth-btn-primary" style={{ textDecoration: 'none' }}>
                <ArrowLeft size={18} />
                <span>Back to Sign In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="auth-alert error">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{error}</div>
                </div>
              )}

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="reset-email">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" size={18} />
                  <input
                    id="reset-email"
                    type="email"
                    className="auth-input"
                    placeholder="admin@dineflow.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading} style={{ marginTop: '1.5rem' }}>
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                    <span>Sending Instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <Send size={18} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link to="/login" style={{ color: '#a8afc4', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowLeft size={16} />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
