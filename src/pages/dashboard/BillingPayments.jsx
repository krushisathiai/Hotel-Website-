import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  IndianRupee,
  CreditCard,
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Search,
  X,
  Smartphone,
  Banknote
} from 'lucide-react';
import api from '../../services/api.js';
import { formatINR } from '../../utils/currency.js';
import { initialIndianInvoices, getStored, setStored } from '../../services/dataStore.js';

export default function BillingPayments() {
  const { user } = useAuth();
  const role = (user?.role || 'manager').toLowerCase();
  const isOwner = role === 'owner' || role === 'admin';

  const [invoices, setInvoices] = useState(() => {
    return getStored('invoices', initialIndianInvoices);
  });
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [settlingRowId, setSettlingRowId] = useState(null);

  // Settlement Form
  const [settleInvoice, setSettleInvoice] = useState(null);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const [payRes, ordersRes] = await Promise.all([
          api.get('/payments'),
          api.get('/orders')
        ]);

        const paidInvoices = (payRes.data?.success && Array.isArray(payRes.data.data))
          ? payRes.data.data.map(p => ({
              id: `INV-${p.id}`,
              orderId: p.order_number || `ORD-${p.order_id}`,
              order_id: p.order_id,
              table: p.table_number || 'Dining Hall',
              customer: p.customer_name || 'Guest',
              subtotal: parseFloat(p.amount) * 0.95,
              tax: parseFloat(p.amount) * 0.05,
              discount: 0,
              total: parseFloat(p.amount),
              paymentMethod: p.payment_method || 'UPI',
              status: 'paid',
              date: new Date(p.paid_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }))
          : [];

        const pendingInvoices = (ordersRes.data?.success && Array.isArray(ordersRes.data.data))
          ? ordersRes.data.data
              .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
              .map(o => ({
                id: `INV-${o.id}`,
                orderId: o.order_number || o.id,
                order_id: o.id,
                table: o.table_number || (o.table_id ? `Table ${o.table_id}` : 'Table 1'),
                customer: o.customer_name || 'Guest',
                subtotal: parseFloat(o.subtotal || o.total_amount * 0.95),
                tax: parseFloat(o.tax_amount || o.total_amount * 0.05),
                discount: parseFloat(o.discount_amount || 0),
                total: parseFloat(o.total_amount || 0),
                paymentMethod: 'Pending',
                status: 'pending',
                date: new Date(o.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                items: o.items || [],
              }))
          : [];

        // Combine: Pending active orders first, then paid invoices
        const combined = [...pendingInvoices, ...paidInvoices];
        if (combined.length > 0) {
          setInvoices(combined);
          setStored('invoices', combined);
        }
      } catch {
        // Fallback to local store data
      }
    };
    fetchPayments();
  }, []);

  const totalCollected = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  const pendingAmount = invoices
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  const handleOpenPay = (inv) => {
    setSettlingRowId(inv.id);
    setSettleInvoice(inv);
    setPaymentMode('UPI');
    setDiscountPercent(0);
    setShowPayModal(true);
    setTimeout(() => setSettlingRowId(null), 300);
  };

  const handlePrintReceipt = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 400);
  };

  const handleCompletePayment = async (e) => {
    e.preventDefault();
    if (!settleInvoice || isSettling) return;

    setIsSettling(true);
    try {
      const discountAmount = ((parseFloat(settleInvoice.subtotal) || 0) * (discountPercent / 100));
      const newTotal = (parseFloat(settleInvoice.total) || 0) - discountAmount;
      const targetOrderId = settleInvoice.order_id || settleInvoice.orderId || settleInvoice.id;

      // 1. Call backend payment API if available
      try {
        await api.post('/payments', {
          order_id: targetOrderId,
          amount: newTotal,
          payment_method: paymentMode.toLowerCase(),
          notes: `Settled with ${discountPercent}% discount`
        });
      } catch (err) {
        console.warn('Backend payment API fallback:', err.message);
      }

      // 2. Explicitly update order status to completed on backend
      try {
        await api.patch(`/orders/${targetOrderId}/status`, { status: 'completed' });
      } catch {
        // offline fallback
      }

      // 3. Update invoice in local state & storage
      const updated = invoices.map((item) =>
        item.id === settleInvoice.id || item.orderId === settleInvoice.orderId
          ? {
              ...item,
              status: 'paid',
              paymentMethod: paymentMode,
              discount: discountAmount,
              total: newTotal,
            }
          : item
      );

      setInvoices(updated);
      setStored('invoices', updated);

      // 4. Free the table in dataStore tables list
      const storedTables = getStored('tables', []);
      const updatedTables = storedTables.map(t => {
        const match = (t.table_number && t.table_number === settleInvoice.table) ||
                      (t.number && t.number === settleInvoice.table);
        return match ? { ...t, status: 'available', currentOrder: null, timeOccupied: null } : t;
      });
      setStored('tables', updatedTables);

      // 5. Update order status in dataStore orders
      const storedOrders = getStored('orders', []);
      const updatedOrders = storedOrders.map(o => {
        const match = o.id === settleInvoice.order_id ||
                      o.order_number === settleInvoice.orderId ||
                      o.id === settleInvoice.orderId ||
                      o.table === settleInvoice.table ||
                      o.table_number === settleInvoice.table;
        return match ? { ...o, status: 'completed' } : o;
      });
      setStored('orders', updatedOrders);

      setShowPayModal(false);
      setSelectedInvoice({
        ...settleInvoice,
        status: 'paid',
        paymentMethod: paymentMode,
        discount: discountAmount,
        total: newTotal,
      });
      setShowReceiptModal(true);
    } finally {
      setIsSettling(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter = filterStatus === 'All' || inv.status === filterStatus.toLowerCase();
    const matchesSearch = inv.id.toLowerCase().includes(search.toLowerCase()) ||
                          inv.customer.toLowerCase().includes(search.toLowerCase()) ||
                          inv.table.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ width: '100%' }}>
      {/* 3 Metric Summary Cards (Responsive) */}
      <div className="stat-cards-grid">
        <div className="dash-stat-card">
          <div>
            <div className="stat-card-label">Total Revenue Settled</div>
            <div className="stat-card-value">{formatINR(totalCollected)}</div>
            <div className="stat-card-trend positive">
              <CheckCircle2 size={14} />
              <span>{invoices.filter((i) => i.status === 'paid').length} Bills Cleared</span>
            </div>
          </div>
          <div className="stat-card-icon-wrapper icon-green">
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="dash-stat-card">
          <div>
            <div className="stat-card-label">Pending Table Tabs</div>
            <div className="stat-card-value">{formatINR(pendingAmount)}</div>
            <div className="stat-card-trend negative">
              <Clock size={14} />
              <span>{invoices.filter((i) => i.status === 'pending').length} In-Service Unpaid</span>
            </div>
          </div>
          <div className="stat-card-icon-wrapper icon-orange">
            <Receipt size={22} />
          </div>
        </div>

        <div className="dash-stat-card">
          <div>
            <div className="stat-card-label">Payment Channels</div>
            <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>UPI &bull; Card &bull; Cash</div>
            <div className="stat-card-trend neutral">
              <span>Instant QR & BharatPe</span>
            </div>
          </div>
          <div className="stat-card-icon-wrapper icon-blue">
            <CreditCard size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar (Responsive) */}
      <div className="page-toolbar">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
          <div className="toolbar-search">
            <Search className="topbar-search-icon" size={16} />
            <input
              type="text"
              className="topbar-search-input"
              placeholder="Search invoice #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'All', label: 'All', count: invoices.length },
              { id: 'Paid', label: 'Paid', count: invoices.filter(i => i.status === 'paid').length },
              { id: 'Pending', label: 'Pending', count: invoices.filter(i => i.status === 'pending').length },
            ].map((tab) => {
              const isActive = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#ff6b35' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#fff' : '#a8afc4',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    background: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
                    color: isActive ? '#fff' : '#cdd2df',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Invoices Table (Responsive Container with Scroll) */}
      <div className="dash-table-container">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Order Ref</th>
              <th>Location</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Date & Time</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
                  No billing invoices found. Everything is clear and ready for new settlements!
                </td>
              </tr>
            ) : filteredInvoices.map((inv) => (
              <tr key={inv.id}>
                <td style={{ fontWeight: 700, color: '#fff' }}>{inv.id}</td>
                <td style={{ color: '#ff8555' }}>{inv.orderId}</td>
                <td>{inv.table}</td>
                <td>{inv.customer}</td>
                <td>
                  <span style={{ fontSize: '0.8rem', color: '#cdd2df' }}>{inv.paymentMethod}</span>
                </td>
                <td style={{ fontWeight: 800, color: '#fff' }}>{formatINR(inv.total)}</td>
                <td>
                  <span className={`badge-status ${inv.status}`}>
                    {inv.status}
                  </span>
                </td>
                <td style={{ color: '#7c849e', fontSize: '0.8rem' }}>{inv.date}</td>
                <td style={{ textAlign: 'right' }}>
                  {inv.status === 'pending' ? (
                    isOwner ? (
                      <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
                        Awaiting Payment
                      </span>
                    ) : (
                      <button
                        className="dash-btn-primary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => handleOpenPay(inv)}
                        disabled={settlingRowId === inv.id}
                      >
                        {settlingRowId === inv.id ? (
                          <div className="btn-loader-wrapper">
                            <span className="btn-spinner">↻</span>
                            <span>Opening...</span>
                          </div>
                        ) : (
                          <span>Settle Bill</span>
                        )}
                      </button>
                    )
                  ) : (
                    <button
                      className="dash-btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setShowReceiptModal(true);
                      }}
                    >
                      <Receipt size={14} />
                      <span>Receipt</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Settlement Payment Modal (Responsive) */}
      {showPayModal && settleInvoice && (
        <div className="dash-modal-overlay">
          <div className="dash-modal" style={{ maxWidth: '480px', width: '95%' }}>
            <div className="dash-modal-header">
              <div>
                <h3 className="dash-modal-title">Settle Invoice {settleInvoice.id}</h3>
                <p style={{ color: '#7c849e', fontSize: '0.8rem' }}>{settleInvoice.table} &bull; {settleInvoice.customer}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowPayModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCompletePayment}>
              {/* Amount Display */}
              <div style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#ff8555', textTransform: 'uppercase', fontWeight: 600 }}>Amount Due</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fff' }}>
                  {formatINR(settleInvoice.total * (1 - discountPercent / 100))}
                </div>
                {discountPercent > 0 && (
                  <div style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {discountPercent}% promotional discount applied
                  </div>
                )}
              </div>

              {/* Payment Mode Selector */}
              <div className="auth-form-group">
                <label className="auth-form-label">Payment Mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                  {[
                    { mode: 'UPI', icon: Smartphone },
                    { mode: 'Card', icon: CreditCard },
                    { mode: 'Cash', icon: Banknote },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.mode}
                        type="button"
                        onClick={() => setPaymentMode(p.mode)}
                        style={{
                          padding: '0.75rem 0.5rem',
                          background: paymentMode === p.mode ? 'rgba(255,107,53,0.18)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${paymentMode === p.mode ? '#ff6b35' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '10px',
                          color: paymentMode === p.mode ? '#fff' : '#a8afc4',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Icon size={18} color={paymentMode === p.mode ? '#ff6b35' : undefined} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.mode}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discount Selector */}
              <div className="auth-form-group">
                <label className="auth-form-label">Apply Discount (%)</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[0, 5, 10, 15, 20].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscountPercent(d)}
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        background: discountPercent === d ? '#ff6b35' : 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: discountPercent === d ? '#fff' : '#cdd2df',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minWidth: '44px'
                      }}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="dash-btn-secondary" onClick={() => setShowPayModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="dash-btn-primary" disabled={isSettling}>
                  {isSettling ? (
                    <div className="btn-loader-wrapper">
                      <span className="btn-spinner">↻</span>
                      <span>Settling Bill...</span>
                    </div>
                  ) : (
                    <div className="btn-loader-wrapper">
                      <CheckCircle2 size={16} />
                      <span>Confirm Settlement</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Thermal Indian Receipt Modal */}
      {showReceiptModal && selectedInvoice && (
        <div className="dash-modal-overlay">
          <div className="dash-modal" style={{ maxWidth: '420px', width: '95%', background: '#ffffff', color: '#1a1a2e', padding: '1.75rem' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cdd2df', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>THE GOLDEN PLATE BISTRO</h2>
              <p style={{ fontSize: '0.75rem', color: '#5b6380', margin: '0.2rem 0' }}>80 Feet Rd, Koramangala 4th Block, Bengaluru</p>
              <p style={{ fontSize: '0.75rem', color: '#5b6380' }}>GSTIN: 29AABCT3518Q1Z2 &bull; Ph: +91 (80) 2553-9000</p>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#434a62', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div><strong>Invoice:</strong> {selectedInvoice.id}</div>
                <div><strong>Table:</strong> {selectedInvoice.table}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{selectedInvoice.date}</div>
                <div><strong>Mode:</strong> {selectedInvoice.paymentMethod}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1a1a2e', borderBottom: '1px solid #1a1a2e', padding: '0.5rem 0', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Subtotal</span>
                <span>{formatINR(selectedInvoice.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>CGST (2.5%) + SGST (2.5%)</span>
                <span>{formatINR(selectedInvoice.tax)}</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '0.25rem' }}>
                  <span>Discount</span>
                  <span>-{formatINR(selectedInvoice.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', marginTop: '0.4rem', borderTop: '1px dashed #cdd2df', paddingTop: '0.4rem' }}>
                <span>TOTAL PAID</span>
                <span>{formatINR(selectedInvoice.total)}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#7c849e', marginBottom: '1.25rem' }}>
              Thank you for dining with us!<br />Please visit again soon.
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="dash-btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handlePrintReceipt}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <div className="btn-loader-wrapper">
                    <span className="btn-spinner">↻</span>
                    <span>Printing Receipt...</span>
                  </div>
                ) : (
                  <div className="btn-loader-wrapper">
                    <Printer size={16} />
                    <span>Print Receipt</span>
                  </div>
                )}
              </button>
              <button
                className="dash-btn-secondary"
                style={{ background: '#f1f3f8', color: '#1a1a2e', borderColor: '#cdd2df' }}
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
