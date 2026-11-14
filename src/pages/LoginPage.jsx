import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  UtensilsCrossed, Mail, Lock, Eye, EyeOff, ArrowRight, 
  Sparkles, AlertCircle, ShieldCheck, TrendingUp, Users 
} from 'lucide-react';
import '../styles/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const roleCredentials = {
    owner: { email: 'owner@dineflow.com', password: 'Demo@1234', path: '/dashboard' },
    waiter: { email: 'waiter@dineflow.com', password: 'Demo@1234', path: '/dashboard/orders' },
    kitchen: { email: 'kitchen@dineflow.com', password: 'Demo@1234', path: '/dashboard/orders' },
    manager: { email: 'manager@dineflow.com', password: 'Demo@1234', path: '/dashboard/billing' },
  };

  const handleDemoFill = (roleKey) => {
    const creds = roleCredentials[roleKey] || roleCredentials.owner;
    setFormData({
      email: creds.email,
      password: creds.password,
      rememberMe: true,
    });
    setError('');
  };

  const handleQuickLogin = async (roleKey) => {
    const creds = roleCredentials[roleKey] || roleCredentials.owner;
    setLoading(true);
    setLoadingRole(roleKey);
    setError('');
    setFormData({
      email: creds.email,
      password: creds.password,
      rememberMe: true,
    });

    try {
      const res = await login(creds.email, creds.password);
      const role = (res?.data?.user?.role || roleKey).toLowerCase();
      if (role === 'waiter' || role === 'staff') {
        navigate('/dashboard/orders');
      } else if (role === 'chef' || role === 'kitchen') {
        navigate('/dashboard/orders');
      } else if (role === 'manager') {
        navigate('/dashboard/billing');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed.';
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingRole(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(formData.email, formData.password);
      const role = (res?.data?.user?.role || '').toLowerCase();
      if (role === 'waiter' || role === 'staff') {
        navigate('/dashboard/orders');
      } else if (role === 'chef' || role === 'kitchen') {
        navigate('/dashboard/orders');
      } else if (role === 'manager') {
        navigate('/dashboard/billing');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Left Brand Showcase Side (Desktop / Tablet) */}
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
            <span>Next-Gen Indian Restaurant OS</span>
          </div>

          <h1 className="auth-side-heading">
            Streamline your entire restaurant in <span className="gradient-text">real-time</span>.
          </h1>

          <p className="auth-side-desc">
            From seamless table seating and lightning-quick POS orders to automated GST billing and live staff shifts — all under one unified platform.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <TrendingUp size={18} />
              </div>
              <span className="auth-feature-text">Boost table turnover rate by up to 34%</span>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Users size={18} />
              </div>
              <span className="auth-feature-text">Multi-role permissions for owners, managers, and waitstaff</span>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <ShieldCheck size={18} />
              </div>
              <span className="auth-feature-text">Secure JWT auth with bank-grade encryption</span>
            </div>
          </div>

          <div className="auth-stats-card">
            <div className="auth-stat-item">
              <div className="auth-stat-value">2,500+</div>
              <div className="auth-stat-label">Restaurants</div>
            </div>
            <div className="auth-stat-item">
              <div className="auth-stat-value">99.98%</div>
              <div className="auth-stat-label">Uptime</div>
            </div>
            <div className="auth-stat-item">
              <div className="auth-stat-value">4.9 / 5</div>
              <div className="auth-stat-label">User Rating</div>
            </div>
          </div>
        </div>

        <div className="auth-side-footer">
          &copy; {new Date().getFullYear()} DineFlow Technologies. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Side */}
      <div className="auth-side-form">
        {/* Mobile Header (Shows only on <= 900px screens) */}
        <div className="auth-mobile-header">
          <Link to="/" className="auth-brand-logo">
            <div className="logo-icon">
              <UtensilsCrossed size={22} />
            </div>
            <span className="logo-text">Dine<span>Flow</span></span>
          </Link>
          <div className="auth-mobile-tagline">Restaurant Management Platform</div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">Welcome back</h2>
            <p className="auth-card-subtitle">
              Don't have an account? <Link to="/signup">Start 14-day free trial</Link>
            </p>
          </div>

          {/* Quick Demo Credentials Autofill */}
          <div className="demo-role-banner">
            <div className="demo-role-label">
              <span>⚡ 1-Click College Demo Login</span>
              <span>Password: Demo@1234</span>
            </div>
            <div className="demo-role-badges" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
              <button 
                type="button" 
                className="demo-role-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.45rem' }}
                onClick={() => handleQuickLogin('owner')}
                disabled={loading}
                title="Full Dashboard & Analytics"
              >
                {loading && loadingRole === 'owner' ? (
                  <>
                    <span className="btn-spinner">↻</span>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>👑</span>
                    <strong>Owner</strong>
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="demo-role-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.45rem' }}
                onClick={() => handleQuickLogin('waiter')}
                disabled={loading}
                title="Takes Table Orders (POS)"
              >
                {loading && loadingRole === 'waiter' ? (
                  <>
                    <span className="btn-spinner">↻</span>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>🍽️</span>
                    <strong>Waiter (Staff)</strong>
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="demo-role-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.45rem' }}
                onClick={() => handleQuickLogin('kitchen')}
                disabled={loading}
                title="Kitchen Order Display (KDS)"
              >
                {loading && loadingRole === 'kitchen' ? (
                  <>
                    <span className="btn-spinner">↻</span>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>👨‍🍳</span>
                    <strong>Kitchen (Chef)</strong>
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="demo-role-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.45rem' }}
                onClick={() => handleQuickLogin('manager')}
                disabled={loading}
                title="Billing, Invoices & Settle Bill"
              >
                {loading && loadingRole === 'manager' ? (
                  <>
                    <span className="btn-spinner">↻</span>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>💼</span>
                    <strong>Billing (Manager)</strong>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-alert error">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="email">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`auth-input ${error ? 'has-error' : ''}`}
                  placeholder="admin@dineflow.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="password">Password</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`auth-input ${error ? 'has-error' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-meta-row">
              <label className="auth-remember-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="auth-forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
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
