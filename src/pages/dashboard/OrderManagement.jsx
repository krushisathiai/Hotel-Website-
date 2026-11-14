import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ShoppingBag,
  Plus,
  Clock,
  CheckCircle2,
  ChefHat,
  ArrowRight,
  Eye,
  X,
  Search,
  Minus,
  Utensils
} from 'lucide-react';
import api from '../../services/api.js';
import { formatINR } from '../../utils/currency.js';
import { initialIndianOrders, initialIndianMenuItems, initialIndianTables, getStored, setStored } from '../../services/dataStore.js';

export default function OrderManagement() {
  const { user } = useAuth();
  const role = (user?.role || 'owner').toLowerCase();
  const isKitchen = role === 'chef' || role === 'kitchen';
  const isWaiter = role === 'waiter' || role === 'staff';
  const isOwner = role === 'owner' || role === 'admin';
  const isManager = role === 'manager';

  const [orders, setOrders] = useState(() => {
    return getStored('orders', initialIndianOrders);
  });
  const [menuCatalog, setMenuCatalog] = useState(() => {
    return getStored('menu', initialIndianMenuItems);
  });
  const [tablesList, setTablesList] = useState(() => {
    return getStored('tables', initialIndianTables);
  });

  const [filterType, setFilterType] = useState(isKitchen ? 'Live' : 'All');
  const [showPosModal, setShowPosModal] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [advancingOrderId, setAdvancingOrderId] = useState(null);

  // POS State
  const [selectedTable, setSelectedTable] = useState('Table 1');
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('Dine-In');
  const [cart, setCart] = useState([]);
  const [posNotes, setPosNotes] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Auto-sync selected table with first available table in tablesList
  useEffect(() => {
    if (tablesList && tablesList.length > 0) {
      const avail = tablesList.find(t => t.status !== 'occupied') || tablesList[0];
      const tNum = avail.table_number || avail.number || 'Table 1';
      setSelectedTable(tNum);
    }
  }, [tablesList]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, menuRes, tablesRes] = await Promise.all([
          api.get('/orders'),
          api.get('/menu'),
          api.get('/tables')
        ]);

        if (ordersRes.data?.success && Array.isArray(ordersRes.data.data)) {
          const stored = getStored('orders', []);
          const merged = ordersRes.data.data.map(serverOrd => {
            const localMatch = stored.find(s => s.id === serverOrd.id || s.order_number === serverOrd.order_number);
            if (localMatch && localMatch.status === 'completed') {
              return { ...serverOrd, status: 'completed' };
            }
            if (localMatch && localMatch.status) {
              return { ...serverOrd, status: localMatch.status };
            }
            return serverOrd;
          });
          stored.forEach(s => {
            if (!merged.some(m => m.id === s.id || m.order_number === s.order_number)) {
              merged.push(s);
            }
          });
          setOrders(merged);
          setStored('orders', merged);
        }
        if (menuRes.data?.success && Array.isArray(menuRes.data.data)) {
          setMenuCatalog(menuRes.data.data);
          setStored('menu', menuRes.data.data);
        }
        if (tablesRes.data?.success && Array.isArray(tablesRes.data.data)) {
          const mappedTbls = tablesRes.data.data.map(t => ({
            id: t.id,
            table_number: t.table_number || `Table ${t.id}`,
            number: t.table_number || `Table ${t.id}`,
            capacity: t.seating_capacity || t.capacity || 4,
            section: t.location || t.section || 'Main Hall',
            status: t.status || 'available',
          }));
          setTablesList(mappedTbls);
          setStored('tables', mappedTbls);
        }
      } catch {
        // Fallback intact with local store
      }
    };
    fetchData();
  }, []);

  const advanceOrderStatus = async (orderId) => {
    const statusProgression = {
      pending: 'in_preparation',
      in_preparation: 'ready',
      preparing: 'ready',
      ready: 'served',
      served: 'completed',
    };

    const targetOrder = orders.find(o => o.id === orderId || o.order_number === orderId);
    if (!targetOrder) return;
    const nextStatus = statusProgression[targetOrder.status] || targetOrder.status;

    setAdvancingOrderId(orderId);
    try {
      // Try backend API
      try {
        await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      } catch {
        // offline fallback
      }

      setOrders((prev) => {
        const updated = prev.map((ord) => {
          if (ord.id === orderId || ord.order_number === orderId) {
            return { ...ord, status: nextStatus };
          }
          return ord;
        });
        setStored('orders', updated);
        return updated;
      });

      // Also update invoice status if completed
      if (nextStatus === 'completed') {
        const storedInvs = getStored('invoices', []);
        const updatedInvs = storedInvs.map(inv => 
          (inv.orderId === orderId || inv.orderId === targetOrder.order_number)
            ? { ...inv, status: 'paid' }
            : inv
        );
        setStored('invoices', updatedInvs);
      }
    } finally {
      setAdvancingOrderId(null);
    }
  };

  const getNextStatusLabel = (status) => {
    switch (status) {
      case 'pending': return isKitchen ? '🔥 Start Cooking' : 'Start Prep';
      case 'in_preparation':
      case 'preparing':
        return '✅ Mark Prepared / Ready';
      case 'ready': return '🍽️ Serve to Table';
      case 'served': return '💳 Ready for Billing';
      default: return 'Completed';
    }
  };

  // Cart operations
  const addToCart = (dish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0);
  const tax = subtotal * 0.05; // 5% GST
  const grandTotal = subtotal + tax;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || isPlacingOrder) return;

    setIsPlacingOrder(true);
    try {
      // Resolve Table UUID
      const matchedTable = tablesList.find(t => 
        (t.table_number && t.table_number === selectedTable) ||
        (t.number && t.number === selectedTable) ||
        t.id === selectedTable
      );
      const tableId = matchedTable ? matchedTable.id : (tablesList[0]?.id || selectedTable);

      let createdApiOrder = null;

      // Try posting to API
      try {
        const res = await api.post('/orders', {
          items: cart.map(c => ({
            menu_item_id: c.id,
            name: c.name,
            quantity: c.quantity,
            price: parseFloat(c.price),
            notes: posNotes
          })),
          table_id: tableId,
          order_type: orderType.toLowerCase(),
          customer_name: customerName || 'Walk-in Guest',
          notes: posNotes
        });
        if (res.data?.success && res.data.data) {
          createdApiOrder = res.data.data;
        }
      } catch {
        // offline fallback
      }

      const orderNumber = createdApiOrder?.order_number || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder = {
        id: createdApiOrder?.id || orderNumber,
        order_number: orderNumber,
        table: orderType === 'Takeaway' ? 'Takeaway Counter' : selectedTable,
        table_number: orderType === 'Takeaway' ? 'Takeaway Counter' : selectedTable,
        customer: customerName || 'Walk-in Guest',
        customer_name: customerName || 'Walk-in Guest',
        type: orderType,
        order_type: orderType,
        items: cart.map((c) => ({ name: c.name, quantity: c.quantity, price: parseFloat(c.price) })),
        subtotal,
        tax,
        total: grandTotal,
        total_amount: grandTotal,
        status: 'pending',
        timeElapsed: 'Just now',
        notes: posNotes,
        created_at: new Date().toISOString(),
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      setStored('orders', updatedOrders);

      // Update table status to occupied
      if (orderType === 'Dine-In') {
        const updatedTables = tablesList.map(t => 
          (t.table_number === selectedTable || t.number === selectedTable || t.id === tableId)
            ? { ...t, status: 'occupied' }
            : t
        );
        setTablesList(updatedTables);
        setStored('tables', updatedTables);
      }

      // Also update invoice in billing
      const existingInvoices = getStored('invoices', []);
      const newInvoice = {
        id: `INV-${newOrder.id}`,
        orderId: newOrder.order_number || newOrder.id,
        order_id: newOrder.id,
        table: newOrder.table,
        customer: newOrder.customer,
        subtotal,
        tax,
        discount: 0,
        total: grandTotal,
        paymentMethod: 'Pending',
        status: 'pending',
        date: 'Just now',
        items: newOrder.items,
      };
      setStored('invoices', [newInvoice, ...existingInvoices]);

      setShowPosModal(false);
      setCart([]);
      setCustomerName('');
      setPosNotes('');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const counts = {
    all: orders.length,
    live: orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length,
    pending: orders.filter((o) => o.status === 'pending').length,
    in_preparation: orders.filter((o) => o.status === 'in_preparation' || o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    served: orders.filter((o) => o.status === 'served').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  const filteredOrders = orders.filter((o) => {
    if (filterType === 'All') return true;
    if (filterType === 'Live') return o.status !== 'completed' && o.status !== 'cancelled';
    if (filterType === 'Completed') return o.status === 'completed';
    return o.status === filterType.toLowerCase() || (filterType.toLowerCase() === 'in_preparation' && o.status === 'preparing');
  });

  const filteredCatalog = menuCatalog.filter(d => 
    d.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (d.category && d.category.toLowerCase().includes(catalogSearch.toLowerCase()))
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Role Notice Banner */}
      {isKitchen && (
        <div style={{
          background: 'rgba(234,88,12,0.12)',
          border: '1px solid rgba(234,88,12,0.3)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <ChefHat size={24} style={{ color: '#f97316', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
              👨‍🍳 Kitchen Display System (KDS) Active
            </div>
            <div style={{ color: '#fed7aa', fontSize: '0.8rem' }}>
              Incoming table tickets from Waiters. Click "Start Cooking" then "Mark Prepared / Ready" when dishes are ready for billing!
            </div>
          </div>
        </div>
      )}

      {isWaiter && (
        <div style={{
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
              🍽️ Waiter POS: Table Seating & Orders
            </div>
            <div style={{ color: '#bfdbfe', fontSize: '0.8rem' }}>
              Take guest order at the table, add dishes, and send ticket straight to the Kitchen!
            </div>
          </div>
          <button className="dash-btn-primary" onClick={() => setShowPosModal(true)}>
            <Plus size={16} />
            <span>+ Take New Table Order</span>
          </button>
        </div>
      )}

      {/* Page Toolbar (Responsive with dynamic order counts) */}
      <div className="page-toolbar">
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['All', 'Live', 'Pending', 'In_Preparation', 'Ready', 'Served', 'Completed'].map((tab) => {
            const key = tab.toLowerCase();
            const count = counts[key] ?? 0;
            const isActive = filterType === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#ff6b35' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#fff' : '#a8afc4',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.replace('_', ' ')}</span>
                <span style={{
                  background: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
                  color: isActive ? '#fff' : '#cdd2df',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {isWaiter && (
          <button className="dash-btn-primary" onClick={() => setShowPosModal(true)}>
            <Plus size={18} />
            <span>New POS Order Ticket</span>
          </button>
        )}
      </div>

      {/* Kitchen / Order Cards Board (Responsive Auto-fill) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: filteredOrders.length === 0 ? '1fr' : 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
        gap: '1.25rem'
      }}>
        {filteredOrders.length === 0 ? (
          <div style={{
            background: '#141722',
            border: '1px dashed rgba(255,255,255,0.12)',
            borderRadius: '16px',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <ShoppingBag size={42} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#ff6b35' }} />
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.4rem' }}>No orders found</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>No orders currently match the selected "{filterType.replace('_', ' ')}" filter.</p>
            {isWaiter && (
              <button className="dash-btn-primary" onClick={() => setShowPosModal(true)} style={{ display: 'inline-flex' }}>
                <Plus size={16} />
                <span>Create New Table Order</span>
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const ordId = ord.order_number || ord.id;
            const ordTable = ord.table || ord.table_number || 'Dine-In';
            const ordCustomer = ord.customer || ord.customer_name || 'Guest';
            const ordType = ord.type || ord.order_type || 'Dine-In';
            const ordItems = ord.items || [];
            const ordTotal = ord.total || ord.total_amount || 0;

            return (
            <div
              key={ordId}
              style={{
                background: '#141722',
                border: ord.status === 'completed' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: ord.status === 'completed' ? '#10b981' : '#ff8555', fontWeight: 700 }}>{ordId}</span>
                  <h4 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, margin: '0.15rem 0' }}>{ordTable}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#7c849e' }}>{ordCustomer} &bull; {ordType}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge-status ${ord.status}`}>
                    {ord.status.replace('_', ' ')}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#636b83', marginTop: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                    <Clock size={12} />
                    <span>{ord.timeElapsed || 'Recent'}</span>
                  </div>
                </div>
              </div>

              {/* Items list */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '0.85rem', margin: '0.5rem 0' }}>
                {ordItems.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', color: '#e4e7ef' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '0.5rem' }}>
                      <strong style={{ color: '#ff6b35', marginRight: '0.4rem' }}>{it.quantity}x</strong>
                      {it.name || it.item_name}
                    </span>
                    <span style={{ color: '#a8afc4', flexShrink: 0 }}>
                      {formatINR((parseFloat(it.price || it.item_price) || 0) * (it.quantity || 1))}
                    </span>
                  </div>
                ))}

                {ord.notes && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.08)', fontSize: '0.75rem', color: '#f59e0b' }}>
                    Note: {ord.notes}
                  </div>
                )}
              </div>

              {/* Total & Action Footer */}
              <div style={{ marginTop: 'auto', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#7c849e', textTransform: 'uppercase' }}>Ticket Total</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                    {formatINR(ordTotal)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <Link
                    to={`/dashboard/orders/${ordId}`}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      color: '#cdd2df',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </Link>

                  {/* Completed Status (All Roles) */}
                  {ord.status === 'completed' && (
                    <span style={{
                      padding: '0.45rem 0.85rem',
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: '8px',
                      color: '#34d399',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <CheckCircle2 size={15} />
                      <span>✅ Billed & Completed</span>
                    </span>
                  )}

                  {/* Served Status */}
                  {ord.status === 'served' && (
                    isManager ? (
                      <Link
                        to="/dashboard/billing"
                        className="dash-btn-primary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        💳 Settle Bill
                      </Link>
                    ) : (
                      <span style={{
                        padding: '0.45rem 0.85rem',
                        background: 'rgba(168,85,247,0.15)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: '8px',
                        color: '#c084fc',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        🍽️ Served • At Billing
                      </span>
                    )
                  )}

                  {/* Kitchen Actions & Status */}
                  {isKitchen && ord.status !== 'completed' && ord.status !== 'served' && (
                    (ord.status === 'pending' || ord.status === 'in_preparation' || ord.status === 'preparing') ? (
                      <button
                        className="dash-btn-primary"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                        onClick={() => advanceOrderStatus(ord.id)}
                        disabled={advancingOrderId === ord.id}
                      >
                        {advancingOrderId === ord.id ? (
                          <div className="btn-loader-wrapper">
                            <span className="btn-spinner">↻</span>
                            <span>Updating...</span>
                          </div>
                        ) : (
                          <div className="btn-loader-wrapper">
                            <span>{getNextStatusLabel(ord.status)}</span>
                            <ArrowRight size={14} />
                          </div>
                        )}
                      </button>
                    ) : ord.status === 'ready' ? (
                      <span style={{
                        padding: '0.45rem 0.85rem',
                        background: 'rgba(234,179,8,0.15)',
                        border: '1px solid rgba(234,179,8,0.3)',
                        borderRadius: '8px',
                        color: '#facc15',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        ✅ Prepared (Waiting for Waiter)
                      </span>
                    ) : null
                  )}

                  {/* Waiter Actions & Status */}
                  {isWaiter && ord.status !== 'completed' && ord.status !== 'served' && (
                    ord.status === 'ready' ? (
                      <button
                        className="dash-btn-primary"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                        onClick={() => advanceOrderStatus(ord.id)}
                        disabled={advancingOrderId === ord.id}
                      >
                        {advancingOrderId === ord.id ? (
                          <div className="btn-loader-wrapper">
                            <span className="btn-spinner">↻</span>
                            <span>Updating...</span>
                          </div>
                        ) : (
                          <div className="btn-loader-wrapper">
                            <span>🍽️ Serve to Table</span>
                            <ArrowRight size={14} />
                          </div>
                        )}
                      </button>
                    ) : ord.status === 'pending' ? (
                      <span style={{
                        padding: '0.45rem 0.85rem',
                        background: 'rgba(59,130,246,0.15)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: '8px',
                        color: '#60a5fa',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        ⏳ Ticket Sent to Kitchen
                      </span>
                    ) : (ord.status === 'in_preparation' || ord.status === 'preparing') ? (
                      <span style={{
                        padding: '0.45rem 0.85rem',
                        background: 'rgba(234,88,12,0.15)',
                        border: '1px solid rgba(234,88,12,0.3)',
                        borderRadius: '8px',
                        color: '#fb923c',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        🔥 Cooking in Kitchen
                      </span>
                    ) : null
                  )}

                  {/* Owner Status Notice */}
                  {isOwner && ord.status !== 'completed' && ord.status !== 'served' && (
                    <span style={{
                      padding: '0.45rem 0.85rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#a8afc4',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      Status: {ord.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* POS Modal: Responsive Create Order Ticket */}
      {showPosModal && (
        <div className="dash-modal-overlay">
          <div className="dash-modal" style={{ maxWidth: '880px', width: '95%' }}>
            <div className="dash-modal-header">
              <div>
                <h3 className="dash-modal-title">New POS Order Ticket</h3>
                <p style={{ color: '#7c849e', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  Select authentic dishes and send directly to kitchen
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowPosModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Responsive Columns: Stacks on mobile/tablet screens */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: '1.5rem'
            }}>
              {/* Left Column: Menu Picker with Search */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#a8afc4', margin: 0 }}>Select Menu Items</h4>
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '0.3rem 0.6rem',
                      color: '#fff',
                      fontSize: '0.78rem',
                      outline: 'none',
                      width: '140px'
                    }}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '0.65rem',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  paddingRight: '0.4rem'
                }}>
                  {filteredCatalog.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => addToCart(dish)}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ff6b35')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                    >
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                        {dish.name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ color: '#ff8555', fontWeight: 700, fontSize: '0.85rem' }}>
                          {formatINR(dish.price)}
                        </span>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: 'rgba(255,107,53,0.15)',
                          color: '#ff6b35',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Plus size={13} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Order Summary & Placement */}
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div className="auth-row-2" style={{ marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#7c849e', display: 'block', marginBottom: '0.25rem' }}>
                      Order Type
                    </label>
                    <select
                      className="dash-select"
                      style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                    >
                      <option value="Dine-In">Dine-In</option>
                      <option value="Takeaway">Takeaway</option>
                      <option value="Delivery">Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#7c849e', display: 'block', marginBottom: '0.25rem' }}>
                      Table
                    </label>
                    <select
                      className="dash-select"
                      style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      disabled={orderType !== 'Dine-In'}
                    >
                      {tablesList.map((t) => {
                        const tNum = t.table_number || t.number || `Table ${t.id}`;
                        const isOccupied = t.status === 'occupied';
                        return (
                          <option key={t.id || tNum} value={tNum}>
                            {tNum} ({t.section || t.location || 'Hall'}) - {t.capacity || t.seating_capacity || 4} Seats {isOccupied ? '🔴 [Occupied]' : '🟢 [Available]'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    className="auth-input"
                    style={{ paddingLeft: '0.75rem', fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                    placeholder="Guest name (e.g. Ramesh Kumar)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                {/* Cart Items List */}
                <div style={{
                  flex: 1,
                  maxHeight: '170px',
                  overflowY: 'auto',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  paddingBottom: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#636b83', fontSize: '0.8rem', padding: '1.5rem 0' }}>
                      Click dishes on the left to add items.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                          <div style={{ fontSize: '0.825rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#7c849e' }}>
                            {formatINR(item.price)} each
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, minWidth: '18px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Special Instructions Note */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    className="auth-input"
                    style={{ paddingLeft: '0.75rem', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                    placeholder="Kitchen instructions (e.g. Less spicy, Jain prep)"
                    value={posNotes}
                    onChange={(e) => setPosNotes(e.target.value)}
                  />
                </div>

                {/* Totals in Indian Rupees */}
                <div style={{ fontSize: '0.8rem', color: '#a8afc4', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GST (CGST 2.5% + SGST 2.5%):</span>
                    <span>{formatINR(tax)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    paddingTop: '0.4rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <span>Grand Total:</span>
                    <span style={{ color: '#ff8555' }}>{formatINR(grandTotal)}</span>
                  </div>
                </div>

                <button
                  className="dash-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0 || isPlacingOrder}
                >
                  {isPlacingOrder ? (
                    <div className="btn-loader-wrapper">
                      <span className="btn-spinner">↻</span>
                      <span>Sending Ticket to Kitchen...</span>
                    </div>
                  ) : (
                    <div className="btn-loader-wrapper">
                      <ChefHat size={16} />
                      <span>Send Ticket to Kitchen</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
