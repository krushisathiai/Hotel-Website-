import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  Grid,
  ShoppingBag,
  Receipt,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import '../styles/dashboard.css';

export default function DashboardLayout() {
  const { user, restaurant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const role = (user?.role || 'owner').toLowerCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleDisplayName = (r) => {
    switch (r) {
      case 'waiter':
      case 'staff':
        return '🍽️ Waiter (Floor Staff)';
      case 'chef':
      case 'kitchen':
        return '👨‍🍳 Kitchen Chef';
      case 'manager':
        return '💼 Billing Manager';
      default:
        return '👑 Owner (Admin)';
    }
  };

  // Dynamic Navigation strictly enforcing user role
  let visibleLinks = [];
  if (role === 'waiter' || role === 'staff') {
    visibleLinks = [
      { to: '/dashboard/orders', label: 'Take Order / POS', icon: ShoppingBag },
      { to: '/dashboard/tables', label: 'Tables & Floor', icon: Grid },
    ];
  } else if (role === 'chef' || role === 'kitchen') {
    visibleLinks = [
      { to: '/dashboard/orders', label: 'Kitchen Orders (KDS)', icon: ShoppingBag },
    ];
  } else if (role === 'manager') {
    visibleLinks = [
      { to: '/dashboard/billing', label: 'Billing & Cashier', icon: Receipt },
      { to: '/dashboard/orders', label: 'Live Orders View', icon: ShoppingBag },
      { to: '/dashboard/tables', label: 'Tables & Floor', icon: Grid },
      { to: '/dashboard/reports', label: 'Sales Reports', icon: BarChart3 },
    ];
  } else {
    // Owner: purely viewing data, reports, tables, menu, settings
    visibleLinks = [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/dashboard/reports', label: 'Sales Reports', icon: BarChart3 },
      { to: '/dashboard/orders', label: 'Live Orders View', icon: ShoppingBag },
      { to: '/dashboard/billing', label: 'Billing & Invoices', icon: Receipt },
      { to: '/dashboard/tables', label: 'Tables & Floor', icon: Grid },
      { to: '/dashboard/menu', label: 'Menu Items', icon: UtensilsCrossed },
      { to: '/dashboard/categories', label: 'Categories', icon: Layers },
      { to: '/dashboard/staff', label: 'Staff & Team', icon: Users },
      { to: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
    ];
  }

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard Overview';
    if (path.includes('/menu')) return 'Menu Management';
    if (path.includes('/categories')) return 'Category Management';
    if (path.includes('/tables')) return 'Table & Floor Plan';
    if (path.includes('/orders')) {
      if (role === 'chef' || role === 'kitchen') return 'Kitchen Display System (KDS)';
      if (role === 'waiter' || role === 'staff') return 'Waiter POS & Table Orders';
      return 'Live Orders & Kitchen (View Only)';
    }
    if (path.includes('/billing')) return 'Billing & Payments';
    if (path.includes('/staff')) return 'Staff & Roles';
    if (path.includes('/reports')) return 'Analytics & Reports';
    if (path.includes('/settings')) return 'Restaurant Settings';
    return 'Dashboard';
  };

  return (
    <div className="dashboard-root">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 45 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <UtensilsCrossed size={20} />
            </div>
            <span className="sidebar-brand-name">Dine<span>Flow</span></span>
          </Link>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Restaurant Badge */}
        <div className="restaurant-badge-card">
          <div className="restaurant-avatar">
            {(restaurant?.name || 'GP').substring(0, 2).toUpperCase()}
          </div>
          <div className="restaurant-info">
            <div className="restaurant-name">{restaurant?.name || 'The Golden Plate'}</div>
            <div className="restaurant-status">Online &bull; Kitchen Open</div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {visibleLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer profile snippet */}
        <div className="sidebar-footer">
          <div className="user-profile-preview">
            <div className="user-avatar-circle">
              {(user?.name || user?.fullName || 'U').substring(0, 1).toUpperCase()}
            </div>
            <div className="user-info-text">
              <div className="user-name">{user?.name || user?.fullName || 'User'}</div>
              <div className="user-role-badge">{getRoleDisplayName(role)}</div>
            </div>
            <button 
              className="logout-icon-btn" 
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign out"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <span className="btn-spinner" style={{ fontSize: '13px' }}>↻</span>
              ) : (
                <LogOut size={16} />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Topbar Header */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button 
              className="mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <h2 className="topbar-page-title">{getPageTitle()}</h2>
          </div>

          <div className="topbar-search-bar">
            <Search className="topbar-search-icon" size={16} />
            <input 
              type="text" 
              className="topbar-search-input" 
              placeholder="Search dishes, orders, tables..."
            />
          </div>

          <div className="topbar-right">
            {(role === 'waiter' || role === 'staff') && (
              <Link to="/dashboard/orders" className="topbar-pos-shortcut">
                <PlusCircle size={16} />
                <span>New POS Order</span>
              </Link>
            )}

            <button 
              className="topbar-action-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={18} />
              <span className="topbar-badge-dot"></span>
            </button>

            <Link 
              to="/" 
              target="_blank" 
              className="topbar-action-btn"
              title="View Public Landing Page"
            >
              <ExternalLink size={18} />
            </Link>
          </div>
        </header>

        {/* Notifications Popup Dropdown */}
        {showNotifications && (
          <div style={{
            position: 'absolute',
            top: '68px',
            right: '1.5rem',
            width: '320px',
            maxWidth: 'calc(100vw - 2rem)',
            background: '#1a1e2c',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '14px',
            padding: '1rem',
            zIndex: 60,
            boxShadow: '0 15px 35px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Notifications</span>
              <button 
                onClick={() => setShowNotifications(false)}
                style={{ background: 'none', border: 'none', color: '#7c849e', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ padding: '0.65rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.8rem' }}>
                <strong style={{ color: '#ff8555' }}>Table #4 Ordered:</strong> 2x Butter Chicken, 4x Garlic Naan.
                <div style={{ color: '#7c849e', fontSize: '0.7rem', marginTop: '0.2rem' }}>2 mins ago</div>
              </div>
              <div style={{ padding: '0.65rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.8rem' }}>
                <strong style={{ color: '#10b981' }}>Bill Paid:</strong> Table #2 - ₹1,850 via UPI QR.
                <div style={{ color: '#7c849e', fontSize: '0.7rem', marginTop: '0.2rem' }}>10 mins ago</div>
              </div>
              <div style={{ padding: '0.65rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.8rem' }}>
                <strong style={{ color: '#f59e0b' }}>Low Stock Alert:</strong> Malai Paneer is running below 3 kg.
                <div style={{ color: '#7c849e', fontSize: '0.7rem', marginTop: '0.2rem' }}>35 mins ago</div>
              </div>
            </div>
          </div>
        )}

        {/* Router Outlet for child pages */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
