import { useState, useEffect } from 'react';
import { Plus, Users, Clock, CheckCircle2, AlertCircle, Edit, Trash2, X, RefreshCw } from 'lucide-react';
import api from '../../services/api.js';
import { formatINR } from '../../utils/currency.js';
import { initialIndianTables, getStored, setStored } from '../../services/dataStore.js';

export default function TableManagement() {
  const [tables, setTables] = useState(() => {
    return getStored('tables', initialIndianTables);
  });
  const [statusFilter, setStatusFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTable, setActiveTable] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [isAddingTable, setIsAddingTable] = useState(false);

  const [formData, setFormData] = useState({
    number: '',
    capacity: 4,
    section: 'Main Hall',
    status: 'available',
  });

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await api.get('/tables');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map(t => ({
            id: t.id,
            number: t.table_number || `Table ${t.id}`,
            table_number: t.table_number || `Table ${t.id}`,
            capacity: t.seating_capacity || t.capacity || 4,
            section: t.location || t.section || 'Main Hall',
            status: t.status || 'available',
            currentOrder: null,
            waiter: 'Available',
            timeOccupied: null,
          }));
          setTables(mapped);
          setStored('tables', mapped);
        }
      } catch {
        // Fallback to local store data
      }
    };
    fetchTables();
  }, []);

  const sections = ['All', 'Main Hall', 'Family Section', 'VIP Lounge', 'Patio Garden', 'Rooftop Terrace'];

  const filteredTables = tables.filter((t) => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter.toLowerCase();
    const matchesSection = sectionFilter === 'All' || t.section === sectionFilter;
    return matchesStatus && matchesSection;
  });

  const updateTableStatus = async (tableId, newStatus) => {
    setUpdatingStatus(newStatus);
    try {
      const updated = tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: newStatus,
              currentOrder: newStatus === 'available' ? null : (t.currentOrder || '₹1,240'),
              timeOccupied: newStatus === 'available' ? null : t.timeOccupied || 'Just now',
            }
          : t
      );
      setTables(updated);
      setStored('tables', updated);

      try {
        await api.patch(`/tables/${tableId}/status`, { status: newStatus });
      } catch {
        // offline fallback
      }
    } finally {
      setUpdatingStatus(null);
      setActiveTable(null);
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!formData.number || isAddingTable) return;

    setIsAddingTable(true);
    try {
      const newT = {
        id: Date.now(),
        number: formData.number,
        table_number: formData.number,
        capacity: parseInt(formData.capacity) || 4,
        section: formData.section,
        status: formData.status,
        currentOrder: null,
        waiter: 'Unassigned',
        timeOccupied: null,
      };

      const updated = [...tables, newT];
      setTables(updated);
      setStored('tables', updated);

      try {
        await api.post('/tables', {
          table_number: formData.number,
          seating_capacity: parseInt(formData.capacity) || 4,
          location: formData.section,
          status: formData.status
        });
      } catch {
        // offline fallback
      }

      setShowAddModal(false);
      setFormData({
        number: '',
        capacity: 4,
        section: 'Main Hall',
        status: 'available',
      });
    } finally {
      setIsAddingTable(false);
    }
  };

  const totalCount = tables.length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;

  return (
    <div style={{ width: '100%' }}>
      {/* Occupancy Indicator Banner (Responsive Flex Wrap) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#141722',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#7c849e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tables</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{totalCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{availableCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupied</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{occupiedCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reserved</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{reservedCount}</div>
          </div>
        </div>

        <button className="dash-btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>Add New Table</span>
        </button>
      </div>

      {/* Filter Toolbar (Responsive) */}
      <div className="page-toolbar">
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['All', 'Available', 'Occupied', 'Reserved', 'Billed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: statusFilter === st ? '#ff6b35' : 'rgba(255,255,255,0.05)',
                color: statusFilter === st ? '#fff' : '#a8afc4',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Section Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.825rem', color: '#7c849e' }}>Section:</span>
          <select
            className="dash-select"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
          >
            {sections.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tables Floor Plan Grid (Responsive minmax) */}
      <div className="table-grid">
        {filteredTables.map((tbl) => (
          <div
            key={tbl.id}
            className={`table-card ${tbl.status}`}
            onClick={() => setActiveTable(tbl)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{tbl.number}</h4>
                <div style={{ fontSize: '0.75rem', color: '#7c849e', marginTop: '0.2rem' }}>{tbl.section}</div>
              </div>
              <span className={`badge-status ${tbl.status}`}>
                {tbl.status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0 0.85rem 0', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a8afc4', fontSize: '0.825rem' }}>
                <Users size={14} color="#ff6b35" />
                <span>{tbl.capacity} Seats</span>
              </div>
              {tbl.timeOccupied && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a8afc4', fontSize: '0.825rem' }}>
                  <Clock size={14} color="#3b82f6" />
                  <span>{tbl.timeOccupied}</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#7c849e' }}>Attendant: <strong style={{ color: '#fff' }}>{tbl.waiter}</strong></span>
              {tbl.currentOrder ? (
                <span style={{ color: '#ff8555', fontWeight: 700, fontSize: '0.9rem' }}>{tbl.currentOrder}</span>
              ) : (
                <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>Ready</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Status Change Action Modal (Responsive) */}
      {activeTable && (
        <div className="dash-modal-overlay">
          <div className="dash-modal" style={{ maxWidth: '440px', width: '95%' }}>
            <div className="dash-modal-header">
              <div>
                <h3 className="dash-modal-title">{activeTable.number} Actions</h3>
                <p style={{ fontSize: '0.8rem', color: '#7c849e', margin: '0.2rem 0 0 0' }}>
                  {activeTable.section} &bull; Capacity {activeTable.capacity} Seats
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveTable(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0' }}>
              <button
                className="dash-btn-secondary"
                style={{ justifyContent: 'center', borderColor: '#10b981', color: '#10b981' }}
                onClick={() => updateTableStatus(activeTable.id, 'available')}
                disabled={!!updatingStatus}
              >
                {updatingStatus === 'available' ? (
                  <div className="btn-loader-wrapper">
                    <span className="btn-spinner">↻</span>
                    <span>Vacating Table...</span>
                  </div>
                ) : (
                  <span>Mark as Available (Vacate Table)</span>
                )}
              </button>

              <button
                className="dash-btn-secondary"
                style={{ justifyContent: 'center', borderColor: '#f59e0b', color: '#f59e0b' }}
                onClick={() => updateTableStatus(activeTable.id, 'occupied')}
                disabled={!!updatingStatus}
              >
                {updatingStatus === 'occupied' ? (
                  <div className="btn-loader-wrapper">
                    <span className="btn-spinner">↻</span>
                    <span>Seating Guests...</span>
                  </div>
                ) : (
                  <span>Seat Guests (Mark Occupied)</span>
                )}
              </button>

              <button
                className="dash-btn-secondary"
                style={{ justifyContent: 'center', borderColor: '#3b82f6', color: '#3b82f6' }}
                onClick={() => updateTableStatus(activeTable.id, 'reserved')}
                disabled={!!updatingStatus}
              >
                {updatingStatus === 'reserved' ? (
                  <div className="btn-loader-wrapper">
                    <span className="btn-spinner">↻</span>
                    <span>Reserving Table...</span>
                  </div>
                ) : (
                  <span>Mark as Reserved</span>
                )}
              </button>

              <button
                className="dash-btn-secondary"
                style={{ justifyContent: 'center', borderColor: '#8b5cf6', color: '#8b5cf6' }}
                onClick={() => updateTableStatus(activeTable.id, 'billed')}
                disabled={!!updatingStatus}
              >
                {updatingStatus === 'billed' ? (
                  <div className="btn-loader-wrapper">
                    <span className="btn-spinner">↻</span>
                    <span>Generating Bill...</span>
                  </div>
                ) : (
                  <span>Generate Bill & Mark Billed</span>
                )}
              </button>
            </div>

            <div style={{ textAlign: 'right', marginTop: '1.25rem' }}>
              <button className="dash-btn-secondary" onClick={() => setActiveTable(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal (Responsive) */}
      {showAddModal && (
        <div className="dash-modal-overlay">
          <div className="dash-modal" style={{ maxWidth: '480px', width: '95%' }}>
            <div className="dash-modal-header">
              <h3 className="dash-modal-title">Add Table to Floor</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTable}>
              <div className="auth-form-group">
                <label className="auth-form-label">Table Number / Identifier *</label>
                <input
                  type="text"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. Table 11 or Garden Booth 2"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                />
              </div>

              <div className="auth-row-2">
                <div className="auth-form-group">
                  <label className="auth-form-label">Floor Section</label>
                  <select
                    className="dash-select"
                    style={{ width: '100%' }}
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  >
                    <option value="Main Hall">Main Hall</option>
                    <option value="Family Section">Family Section</option>
                    <option value="VIP Lounge">VIP Lounge</option>
                    <option value="Patio Garden">Patio Garden</option>
                    <option value="Rooftop Terrace">Rooftop Terrace</option>
                  </select>
                </div>

                <div className="auth-form-group">
                  <label className="auth-form-label">Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="auth-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="dash-btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="dash-btn-primary" disabled={isAddingTable}>
                  {isAddingTable ? (
                    <div className="btn-loader-wrapper">
                      <span className="btn-spinner">↻</span>
                      <span>Adding Table...</span>
                    </div>
                  ) : (
                    <span>Add Table</span>
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
