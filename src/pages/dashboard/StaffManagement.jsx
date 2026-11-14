import { useState, useEffect } from 'react';
import { Plus, Users, Mail, Phone, ShieldCheck, Edit2, Trash2, X, Check, Clock } from 'lucide-react';
import api from '../../services/api.js';
import { initialIndianStaff, getStored, setStored } from '../../services/dataStore.js';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState(() => {
    return getStored('staff', initialIndianStaff);
  });
  const [roleFilter, setRoleFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: 'waiter',
    email: '',
    phone: '',
    shift: 'Morning (8AM - 4PM)',
    status: 'active',
  });

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get('/staff');
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map(s => ({
            id: s.id,
            name: s.name,
            role: s.role,
            email: s.email || 'staff@dineflow.com',
            phone: s.phone || '+91 98200 00000',
            shift: s.shift || 'Morning (8AM - 4PM)',
            status: s.is_active ? 'active' : 'inactive',
            joined: 'Jan 2024',
          }));
          setStaffList(mapped);
          setStored('staff', mapped);
        }
      } catch {
        // Fallback to local store data
      }
    };
    fetchStaff();
  }, []);

  const roles = ['All', 'Admin', 'Manager', 'Chef', 'Waiter', 'Cashier'];

  const filteredStaff = staffList.filter((s) => {
    if (roleFilter === 'All') return true;
    return s.role.toLowerCase() === roleFilter.toLowerCase();
  });

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      role: 'waiter',
      email: '',
      phone: '',
      shift: 'Morning (8AM - 4PM)',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      shift: staff.shift || 'Morning (8AM - 4PM)',
      status: staff.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      const updated = staffList.filter((s) => s.id !== id);
      setStaffList(updated);
      setStored('staff', updated);

      try {
        await api.delete(`/staff/${id}`);
      } catch {
        // offline fallback
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || isSaving) return;

    setIsSaving(true);
    try {
      if (editingStaff) {
        const updated = staffList.map((s) =>
          s.id === editingStaff.id ? { ...s, ...formData } : s
        );
        setStaffList(updated);
        setStored('staff', updated);

        try {
          await api.put(`/staff/${editingStaff.id}`, formData);
        } catch {
          // offline fallback
        }
      } else {
        const newMember = {
          id: Date.now(),
          ...formData,
          joined: 'Just now',
        };
        const updated = [...staffList, newMember];
        setStaffList(updated);
        setStored('staff', updated);

        try {
          await api.post('/staff', formData);
        } catch {
          // offline fallback
        }
      }
      setShowModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role.toLowerCase()) {
      case 'admin': return { bg: 'rgba(255,107,53,0.15)', color: '#ff6b35' };
      case 'manager': return { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' };
      case 'chef': return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
      case 'cashier': return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' };
      default: return { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' };
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header Toolbar (Responsive) */}
      <div className="page-toolbar">
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: roleFilter === r ? '#ff6b35' : 'rgba(255,255,255,0.05)',
                color: roleFilter === r ? '#fff' : '#a8afc4',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <button className="dash-btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table (Responsive Scroll) */}
      <div className="dash-table-container">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>System Role</th>
              <th>Contact Info</th>
              <th>Assigned Shift</th>
              <th>Status</th>
              <th>Tenure</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => {
              const badge = getRoleBadgeStyle(member.role);
              return (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: badge.bg,
                        color: badge.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        {member.name.substring(0, 1)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{member.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#7c849e' }}>ID: EMP-{member.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: badge.bg,
                      color: badge.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.825rem', color: '#cdd2df' }}>{member.email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#7c849e' }}>{member.phone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: '#a8afc4' }}>
                      <Clock size={13} color="#ff8555" />
                      <span>{member.shift}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-status ${member.status}`}>
                      {member.status}
                    </span>
                  </td>
                  <td style={{ color: '#7c849e', fontSize: '0.8rem' }}>{member.joined}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenEdit(member)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cdd2df', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                        title="Edit Member"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                        title="Delete Member"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Staff Modal (Responsive) */}
      {showModal && (
        <div className="dash-modal-overlay">
          <div className="dash-modal" style={{ maxWidth: '520px', width: '95%' }}>
            <div className="dash-modal-header">
              <h3 className="dash-modal-title">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label className="auth-form-label">Full Name *</label>
                <input
                  type="text"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="auth-row-2">
                <div className="auth-form-group">
                  <label className="auth-form-label">Role</label>
                  <select
                    className="dash-select"
                    style={{ width: '100%' }}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="waiter">Waiter</option>
                    <option value="chef">Chef / Head Cook</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="auth-form-group">
                  <label className="auth-form-label">Status</label>
                  <select
                    className="dash-select"
                    style={{ width: '100%' }}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="auth-row-2">
                <div className="auth-form-group">
                  <label className="auth-form-label">Email Address *</label>
                  <input
                    type="email"
                    className="auth-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="ramesh@dineflow.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="auth-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="+91 98200 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label">Working Shift</label>
                <select
                  className="dash-select"
                  style={{ width: '100%' }}
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                >
                  <option value="Morning (8AM - 4PM)">Morning (8AM - 4PM)</option>
                  <option value="Evening (4PM - 12AM)">Evening (4PM - 12AM)</option>
                  <option value="Full Day">Full Day</option>
                  <option value="Night Shift (10PM - 6AM)">Night Shift (10PM - 6AM)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="dash-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="dash-btn-primary" disabled={isSaving}>
                  {isSaving ? (
                    <div className="btn-loader-wrapper">
                      <span className="btn-spinner">↻</span>
                      <span>Saving Staff...</span>
                    </div>
                  ) : (
                    <span>{editingStaff ? 'Update Member' : 'Save Staff Member'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
