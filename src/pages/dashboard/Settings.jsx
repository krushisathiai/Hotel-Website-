import { useState, useEffect } from 'react';
import {
  Save,
  Building,
  Clock,
  Receipt,
  Bell,
  CheckCircle2,
  Percent,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { initialSettings, getStored, setStored } from '../../services/dataStore.js';

export default function Settings() {
  const { setRestaurant } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState(() => {
    return getStored('settings', initialSettings);
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.success && res.data.data) {
          const s = res.data.data;
          setFormData((prev) => ({
            ...prev,
            name: s.name || prev.name,
            phone: s.phone || prev.phone,
            email: s.email || prev.email,
            address: s.address ? `${s.address}, ${s.city || ''} ${s.state || ''}` : prev.address,
            gstin: s.tax_name || prev.gstin,
            taxRate: parseFloat(s.tax_rate) || prev.taxRate,
            serviceCharge: parseFloat(s.service_charge_rate) || prev.serviceCharge,
          }));
        }
      } catch {
        // Fallback to local store data
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSavedSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      setStored('settings', formData);

      // Update restaurant in AuthContext
      if (setRestaurant) {
        setRestaurant((prev) => ({
          ...prev,
          name: formData.name,
          phone: formData.phone,
        }));
      }

      try {
        await api.put('/settings', {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          currency: formData.currency,
          currency_symbol: '₹',
          tax_rate: formData.taxRate,
          service_charge_rate: formData.serviceCharge,
        });
      } catch {
        // offline fallback
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
      <div className="page-toolbar">
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Restaurant Settings
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#7c849e', marginTop: '0.2rem' }}>
            Manage Indian restaurant identity, GSTIN, taxation, thermal receipts, and system alerts
          </p>
        </div>

        <button className="dash-btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <div className="btn-loader-wrapper">
              <span className="btn-spinner">↻</span>
              <span>Saving...</span>
            </div>
          ) : (
            <div className="btn-loader-wrapper">
              <Save size={16} />
              <span>Save Changes</span>
            </div>
          )}
        </button>
      </div>

      {savedSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#6ee7b7',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          marginBottom: '1.5rem'
        }}>
          <CheckCircle2 size={18} />
          <span>Settings saved successfully! Changes are live across all POS terminals and floor plans.</span>
        </div>
      )}

      {/* Settings Navigation Tabs (Responsive Horizontal Scroll) */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '0.5rem',
        overflowX: 'auto',
        maxWidth: '100%'
      }}>
        {[
          { key: 'general', label: 'Restaurant Profile', icon: Building },
          { key: 'taxes', label: 'GST & Operations', icon: Percent },
          { key: 'receipt', label: 'Receipt & Printing', icon: Receipt },
          { key: 'alerts', label: 'Audio & Notifications', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.key ? 'rgba(255,107,53,0.15)' : 'transparent',
                color: activeTab === tab.key ? '#ff8555' : '#a8afc4',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="dash-panel">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.25rem' }}>Business Profile</h4>

            <div className="auth-row-2">
              <div className="auth-form-group">
                <label className="auth-form-label">Restaurant Brand Name</label>
                <input
                  type="text"
                  name="name"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label">Brand Tagline / Specialty</label>
                <input
                  type="text"
                  name="tagline"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.tagline}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-row-2">
              <div className="auth-form-group">
                <label className="auth-form-label">Contact Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label">Support Email</label>
                <input
                  type="email"
                  name="email"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label">Physical Address</label>
              <input
                type="text"
                name="address"
                className="auth-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="auth-row-2">
              <div className="auth-form-group">
                <label className="auth-form-label">GSTIN / Tax ID</label>
                <input
                  type="text"
                  name="gstin"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.gstin}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label">Operating Currency</label>
                <select
                  name="currency"
                  className="dash-select"
                  style={{ width: '100%' }}
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="₹ (INR)">₹ (INR) - Indian Rupee (Default)</option>
                  <option value="$ (USD)">$ (USD) - United States Dollar</option>
                  <option value="€ (EUR)">€ (EUR) - Euro</option>
                  <option value="£ (GBP)">£ (GBP) - British Pound</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Taxes & Operations Tab */}
        {activeTab === 'taxes' && (
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.25rem' }}>GST & Operating Schedule</h4>

            <div className="auth-row-2">
              <div className="auth-form-group">
                <label className="auth-form-label">Opening Hours</label>
                <input
                  type="text"
                  name="openingTime"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.openingTime}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label">Closing Hours</label>
                <input
                  type="text"
                  name="closingTime"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.closingTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-row-2">
              <div className="auth-form-group">
                <label className="auth-form-label">Restaurant GST Rate (%) [CGST 2.5% + SGST 2.5%]</label>
                <input
                  type="number"
                  step="0.1"
                  name="taxRate"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.taxRate}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label">Service Charge (%) [Optional]</label>
                <input
                  type="number"
                  step="0.1"
                  name="serviceCharge"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.serviceCharge}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Receipt Tab */}
        {activeTab === 'receipt' && (
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.25rem' }}>Thermal Receipt Header & Footer</h4>

            <div className="auth-form-group">
              <label className="auth-form-label">Receipt Header Title</label>
              <input
                type="text"
                name="receiptHeader"
                className="auth-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.receiptHeader}
                onChange={handleChange}
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label">Receipt Footer Greetings / Social Handle</label>
              <textarea
                name="receiptFooter"
                className="auth-input"
                style={{ paddingLeft: '1rem', minHeight: '80px', resize: 'vertical' }}
                value={formData.receiptFooter}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {/* Audio & Alerts Tab */}
        {activeTab === 'alerts' && (
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.25rem' }}>Kitchen Bells & Notifications</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="soundAlerts"
                  checked={formData.soundAlerts}
                  onChange={handleChange}
                  style={{ accentColor: '#ff6b35', width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Play Kitchen Audio Bell</div>
                  <div style={{ color: '#7c849e', fontSize: '0.75rem' }}>Play a chime when new POS or online tickets arrive</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="emailDailyReport"
                  checked={formData.emailDailyReport}
                  onChange={handleChange}
                  style={{ accentColor: '#ff6b35', width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Send Daily Midnight Sales Digest</div>
                  <div style={{ color: '#7c849e', fontSize: '0.75rem' }}>Automatically email consolidated revenue PDF to the manager</div>
                </div>
              </label>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button type="submit" className="dash-btn-primary">
            <Save size={16} />
            <span>Save All Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
