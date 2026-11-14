import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  UtensilsCrossed, Mail, Lock, User, Store, Phone, Eye, EyeOff, 
  ArrowRight, AlertCircle, CheckCircle2, Sparkles
} from 'lucide-react';
import '../styles/auth.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    restaurantName: '',
    role: 'admin',
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.restaurantName) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!formData.termsAccepted) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        restaurantName: formData.restaurantName,
        role: formData.role,
      });
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Brand Side (Desktop) */}
      <div className="auth-side-brand">
        <Link to="/" className="auth-brand-logo">
          <div className="logo-icon">
            <UtensilsCrossed size={24} />
          </div>
          <span className="logo-text">Dine<span>Flow</span></span>
        </Link>

        <div className="auth-side-content">
          <div className="auth-pill-badge">
            <Sparkles size={14} />
            <span>14-Day Free Trial &bull; No Credit Card Required</span>
          </div>

          <h1 className="auth-side-heading">
            Join thousands of restaurants running on <span className="gradient-text">autopilot</span>.
          </h1>

          <p className="auth-side-desc">
            Set up your restaurant in under 3 minutes. Upload your menu, configure floor tables, and start processing orders with zero complex hardware needed.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <CheckCircle2 size={18} />
              </div>
              <span className="auth-feature-text">Zero setup fee &bull; Instant cloud deployment</span>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <CheckCircle2 size={18} />
              </div>
              <span className="auth-feature-text">Full POS, inventory, table reservation, and analytics</span>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <CheckCircle2 size={18} />
              </div>
              <span className="auth-feature-text">24/7 dedicated onboarding & support</span>
            </div>
          </div>
        </div>

        <div className="auth-side-footer">
          &copy; {new Date().getFullYear()} DineFlow Technologies. All rights reserved.
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-side-form">
        {/* Mobile Header (Shows on <= 900px screens) */}
        <div className="auth-mobile-header">
          <Link to="/" className="auth-brand-logo">
            <div className="logo-icon">
              <UtensilsCrossed size={22} />
            </div>
            <span className="logo-text">Dine<span>Flow</span></span>
          </Link>
          <div className="auth-mobile-tagline">Start your 14-day free trial</div>
        </div>

        <div className="auth-card" style={{ maxWidth: '520px' }}>
          <div className="auth-card-header">
            <h2 className="auth-card-title">Create your account</h2>
            <p className="auth-card-subtitle">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>

          {error && (
            <div className="auth-alert error">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-row-2">
              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="name">Your Full Name *</label>
                <div className="auth-input-wrapper">
                  <User className="auth-input-icon" size={18} />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="auth-input"
                    placeholder="Sanjay Deshmukh"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="phone">Phone Number</label>
                <div className="auth-input-wrapper">
                  <Phone className="auth-input-icon" size={18} />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="auth-input"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="restaurantName">Restaurant Name *</label>
              <div className="auth-input-wrapper">
                <Store className="auth-input-icon" size={18} />
                <input
                  id="restaurantName"
                  name="restaurantName"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. The Golden Plate"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="email">Email Address *</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="auth-input"
                  placeholder="owner@restaurant.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="password">Password *</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-form-group" style={{ marginTop: '1.25rem' }}>
              <label className="auth-remember-label">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                />
                <span>
                  I agree to the <a href="#terms" style={{ color: '#ff6b35' }}>Terms of Service</a> & <a href="#privacy" style={{ color: '#ff6b35' }}>Privacy Policy</a>
                </span>
              </label>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading} style={{ marginTop: '1.25rem' }}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                  <span>Creating Restaurant...</span>
                </>
              ) : (
                <>
                  <span>Launch Free Trial</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
