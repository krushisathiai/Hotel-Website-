import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle2, Clock, MapPin, User, FileText, Utensils, Receipt } from 'lucide-react';
import api from '../../services/api.js';
import { formatINR } from '../../utils/currency.js';
import { initialIndianOrders, getStored } from '../../services/dataStore.js';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/${id}`);
        if (res.data?.success && res.data.data) {
          setOrder(res.data.data);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to local store
      }

      const storedOrders = getStored('orders', initialIndianOrders);
      const matched = storedOrders.find(
        (o) => String(o.id) === String(id) || o.order_number === String(id)
      );

      if (matched) {
        setOrder({
          id: matched.order_number || matched.id,
          table: matched.table || matched.table_number || 'Table 4',
          section: 'Main Dining Hall',
          customer: matched.customer || matched.customer_name || 'Guest',
          phone: matched.customer_phone || '+91 98765 43210',
          server: 'Sita Devi',
          orderType: matched.type || matched.order_type || 'Dine-In',
          createdAt: matched.timeElapsed || 'Today, 1:24 PM',
          status: matched.status || 'in_preparation',
          paymentStatus: matched.status === 'completed' ? 'paid' : 'unpaid',
          notes: matched.notes || 'No special instructions recorded.',
          items: matched.items && matched.items.length > 0 ? matched.items.map(it => ({
            name: it.name || it.item_name,
            category: 'Indian Cuisine',
            quantity: it.quantity || 1,
            price: parseFloat(it.price || it.item_price) || 250,
            instructions: it.notes || ''
          })) : [
            { name: 'Paneer Butter Masala', category: 'Mains', quantity: 2, price: 340, instructions: 'Extra butter on side' },
            { name: 'Garlic Butter Naan', category: 'Breads', quantity: 4, price: 65, instructions: 'Crispy' },
            { name: 'Warm Gulab Jamun (2 pcs)', category: 'Desserts', quantity: 2, price: 140, instructions: 'Serve warm' },
          ]
        });
      } else {
        // Default template
        setOrder({
          id: id || 'ORD-8921',
          table: 'Table 4',
          section: 'Main Dining Hall',
          customer: 'Rajesh Sharma',
          phone: '+91 98111 22334',
          server: 'Sita Devi',
          orderType: 'Dine-In',
          createdAt: 'Today, 1:24 PM',
          status: 'in_preparation',
          paymentStatus: 'unpaid',
          notes: 'Medium spice level, customer has slight allergy to walnuts.',
          items: [
            { name: 'Paneer Butter Masala', category: 'Mains', quantity: 2, price: 340, instructions: 'Extra black cumin' },
            { name: 'Garlic Butter Naan', category: 'Breads', quantity: 4, price: 65, instructions: 'Hot from tandoor' },
            { name: 'Warm Gulab Jamun (2 pcs)', category: 'Desserts', quantity: 2, price: 140, instructions: 'Serve with pistachios' },
            { name: 'Alphonso Mango Lassi', category: 'Beverages', quantity: 2, price: 150, instructions: 'Chilled' },
          ],
        });
      }
      setLoading(false);
    };

    fetchOrder();
  }, [id]);

  if (loading || !order) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#a8afc4' }}>
        Loading order details...
      </div>
    );
  }

  const items = order.items || [];
  const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);
  const tax = subtotal * 0.05; // 5% GST
  const serviceCharge = order.orderType === 'Takeaway' ? 0 : subtotal * 0.05;
  const total = subtotal + tax + serviceCharge;

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 400);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      {/* Top back & actions toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <button
          onClick={() => navigate('/dashboard/orders')}
          className="dash-btn-secondary"
          style={{ padding: '0.45rem 0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Live Orders</span>
        </button>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="dash-btn-secondary" onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <div className="btn-loader-wrapper">
                <span className="btn-spinner">↻</span>
                <span>Printing...</span>
              </div>
            ) : (
              <div className="btn-loader-wrapper">
                <Printer size={16} />
                <span>Print KOT Ticket</span>
              </div>
            )}
          </button>
          <button className="dash-btn-primary" onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <div className="btn-loader-wrapper">
                <span className="btn-spinner">↻</span>
                <span>Printing...</span>
              </div>
            ) : (
              <div className="btn-loader-wrapper">
                <Receipt size={16} />
                <span>Print GST Receipt</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="dash-panel">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Order #{order.id}
              </h2>
              <span className={`badge-status ${order.status}`}>{order.status.replace('_', ' ')}</span>
            </div>
            <p style={{ color: '#7c849e', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Placed on {order.createdAt} &bull; Attendant: <strong style={{ color: '#e4e7ef' }}>{order.server}</strong>
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#7c849e', textTransform: 'uppercase' }}>Amount Due</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ff6b35' }}>
              {formatINR(total)}
            </div>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.5rem',
              background: order.paymentStatus === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: order.paymentStatus === 'paid' ? '#10b981' : '#ef4444',
              borderRadius: '4px',
              fontWeight: 600
            }}>
              {order.paymentStatus === 'paid' ? 'Payment Completed' : 'Payment Pending'}
            </span>
          </div>
        </div>

        {/* Customer & Location Meta */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
          background: 'rgba(255,255,255,0.02)',
          padding: '1.15rem',
          borderRadius: '12px'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#7c849e', marginBottom: '0.2rem' }}>Dining Location</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{order.table}</div>
            <div style={{ fontSize: '0.8rem', color: '#a8afc4' }}>{order.section}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#7c849e', marginBottom: '0.2rem' }}>Customer Details</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{order.customer}</div>
            <div style={{ fontSize: '0.8rem', color: '#a8afc4' }}>{order.phone}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#7c849e', marginBottom: '0.2rem' }}>Order Channel</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{order.orderType}</div>
            <div style={{ fontSize: '0.8rem', color: '#10b981' }}>Table Service</div>
          </div>
        </div>

        {/* Items Table */}
        <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.85rem' }}>
          Ordered Items ({items.length})
        </h4>
        <div className="dash-table-container" style={{ marginBottom: '1.5rem' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Item & Kitchen Notes</th>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{item.name}</div>
                    {item.instructions && (
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.2rem' }}>
                        &bull; {item.instructions}
                      </div>
                    )}
                  </td>
                  <td>{item.category}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#ff8555' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatINR(item.price)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                    {formatINR((item.price * item.quantity))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes & Bill Breakdown (Responsive Stacking) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            padding: '1.15rem',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a8afc4', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Special Kitchen Instructions
            </div>
            <p style={{ color: '#cdd2df', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              {order.notes || 'None recorded for this ticket.'}
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.02)',
            padding: '1.15rem',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a8afc4', fontSize: '0.875rem' }}>
              <span>Items Subtotal:</span>
              <span style={{ color: '#fff' }}>{formatINR(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a8afc4', fontSize: '0.875rem' }}>
              <span>GST (CGST 2.5% + SGST 2.5%):</span>
              <span style={{ color: '#fff' }}>{formatINR(tax)}</span>
            </div>
            {serviceCharge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a8afc4', fontSize: '0.875rem' }}>
                <span>Service Charge (5%):</span>
                <span style={{ color: '#fff' }}>{formatINR(serviceCharge)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 800,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '0.5rem',
              marginTop: '0.25rem'
            }}>
              <span>Total Payable:</span>
              <span style={{ color: '#ff8555' }}>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
