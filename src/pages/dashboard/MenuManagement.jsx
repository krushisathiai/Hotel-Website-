import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Clock,
  UtensilsCrossed,
  X,
  Check
} from 'lucide-react';
import api from '../../services/api.js';
import { formatINR } from '../../utils/currency.js';
import { initialIndianMenuItems, getStored, setStored } from '../../services/dataStore.js';

export default function MenuManagement() {
  const [items, setItems] = useState(() => {
    return getStored('menu', initialIndianMenuItems);
  });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dietFilter, setDietFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Mains',
    price: '',
    isVeg: true,
    prepTime: 15,
    isAvailable: true,
    description: '',
  });

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get('/menu');
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setItems(res.data.data);
          setStored('menu', res.data.data);
        }
      } catch {
        // Fallback to local store data
      }
    };
    fetchMenu();
  }, []);

  const categories = ['All', 'Starters', 'Mains', 'Breads', 'Desserts', 'Beverages'];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesDiet = dietFilter === 'All' || (dietFilter === 'Veg' ? item.isVeg : !item.isVeg);
    return matchesSearch && matchesCategory && matchesDiet;
  });

  const toggleAvailability = async (id) => {
    const updated = items.map((it) =>
      it.id === id ? { ...it, isAvailable: !it.isAvailable } : it
    );
    setItems(updated);
    setStored('menu', updated);

    try {
      const item = updated.find(it => it.id === id);
      if (item) {
        await api.put(`/menu/${id}`, { is_available: item.isAvailable });
      }
    } catch {
      // offline fallback
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Mains',
      price: '',
      isVeg: true,
      prepTime: 15,
      isAvailable: true,
      description: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      isVeg: item.isVeg,
      prepTime: item.prepTime || item.prep_time || 15,
      isAvailable: item.isAvailable,
      description: item.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this dish from the menu?')) {
      const updated = items.filter((it) => it.id !== id);
      setItems(updated);
      setStored('menu', updated);
      try {
        await api.delete(`/menu/${id}`);
      } catch {
        // offline fallback
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || isSaving) return;

    setIsSaving(true);
    try {
      const parsedPrice = parseFloat(formData.price) || 0;

      if (editingItem) {
        const updated = items.map((it) =>
          it.id === editingItem.id
            ? { ...it, ...formData, price: parsedPrice }
            : it
        );
        setItems(updated);
        setStored('menu', updated);

        try {
          await api.put(`/menu/${editingItem.id}`, { ...formData, price: parsedPrice });
        } catch {
          // offline fallback
        }
      } else {
        const newItem = {
          id: Date.now(),
          ...formData,
          price: parsedPrice,
        };
        const updated = [newItem, ...items];
        setItems(updated);
        setStored('menu', updated);

        try {
          await api.post('/menu', { ...formData, price: parsedPrice });
        } catch {
          // offline fallback
        }
      }
      setShowModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Page Header Toolbar (Responsive) */}
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', width: '100%' }}>
          <div className="toolbar-search">
            <Search className="topbar-search-icon" size={16} />
            <input
              type="text"
              className="topbar-search-input"
              placeholder="Search dishes or ingredients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.35rem',
            background: '#141722',
            padding: '0.25rem',
            borderRadius: '10px',
            overflowX: 'auto',
            maxWidth: '100%'
          }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedCategory === cat ? '#ff6b35' : 'transparent',
                  color: selectedCategory === cat ? '#fff' : '#a8afc4',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Diet Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setDietFilter('All')}
              className={`dash-btn-secondary ${dietFilter === 'All' ? 'active' : ''}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              All Diet
            </button>
            <button
              onClick={() => setDietFilter('Veg')}
              className={`dash-btn-secondary ${dietFilter === 'Veg' ? 'active' : ''}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: dietFilter === 'Veg' ? '#10b981' : undefined }}
            >
              Veg Only
            </button>
            <button
              onClick={() => setDietFilter('Non-Veg')}
              className={`dash-btn-secondary ${dietFilter === 'Non-Veg' ? 'active' : ''}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: dietFilter === 'Non-Veg' ? '#ef4444' : undefined }}
            >
              Non-Veg Only
            </button>
          </div>
        </div>

        <button className="dash-btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Menu Cards Grid (Responsive minmax) */}
      <div className="menu-grid">
        {filteredItems.map((dish) => (
          <div key={dish.id} className="menu-card" style={{ opacity: dish.isAvailable ? 1 : 0.65 }}>
            <div className="menu-card-img-placeholder">
              <UtensilsCrossed size={40} opacity={0.5} />
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(6px)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span className={`veg-indicator ${dish.isVeg ? 'veg' : 'non-veg'}`}></span>
                <span>{dish.category}</span>
              </div>

              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(6px)',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#cdd2df',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Clock size={12} />
                <span>{dish.prepTime || dish.prep_time || 15}m</span>
              </div>
            </div>

            <div className="menu-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  {dish.name}
                </h4>
                <span style={{ color: '#ff8555', fontSize: '1.15rem', fontWeight: 800, whiteSpace: 'nowrap', paddingLeft: '0.5rem' }}>
                  {formatINR(dish.price)}
                </span>
              </div>

              <p style={{ color: '#7c849e', fontSize: '0.825rem', lineHeight: 1.5, marginBottom: '1.15rem', flex: 1 }}>
                {dish.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Available toggle */}
                <label className="toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={dish.isAvailable}
                    onChange={() => toggleAvailability(dish.id)}
                    style={{ accentColor: '#ff6b35', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: dish.isAvailable ? '#10b981' : '#7c849e', fontWeight: 600 }}>
                    {dish.isAvailable ? 'In Stock' : 'Sold Out'}
                  </span>
                </label>

                {/* Edit & Delete actions */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => handleOpenEdit(dish)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cdd2df', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                    title="Edit Item"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(dish.id)}
                    style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                    title="Delete Item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal (Responsive) */}
      {showModal && (
        <div className="dash-modal-overlay">
          <div className="dash-modal" style={{ maxWidth: '580px', width: '95%' }}>
            <div className="dash-modal-header">
              <h3 className="dash-modal-title">
                {editingItem ? 'Edit Dish' : 'Add New Menu Dish'}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="auth-form-group">
                <label className="auth-form-label">Dish Name *</label>
                <input
                  type="text"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. Paneer Tikka Masala"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="auth-row-2">
                <div className="auth-form-group">
                  <label className="auth-form-label">Category</label>
                  <select
                    className="dash-select"
                    style={{ width: '100%' }}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Breads">Breads</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div className="auth-form-group">
                  <label className="auth-form-label">Price (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    className="auth-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="340"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-row-2">
                <div className="auth-form-group">
                  <label className="auth-form-label">Dietary Preference</label>
                  <select
                    className="dash-select"
                    style={{ width: '100%' }}
                    value={formData.isVeg ? 'veg' : 'non-veg'}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.value === 'veg' })}
                  >
                    <option value="veg">Vegetarian (Veg)</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>

                <div className="auth-form-group">
                  <label className="auth-form-label">Prep Time (minutes)</label>
                  <input
                    type="number"
                    className="auth-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label">Description & Ingredients</label>
                <textarea
                  className="auth-input"
                  style={{ paddingLeft: '1rem', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Fresh ingredients, notes for kitchen..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="dash-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="dash-btn-primary" disabled={isSaving}>
                  {isSaving ? (
                    <div className="btn-loader-wrapper">
                      <span className="btn-spinner">↻</span>
                      <span>Saving Dish...</span>
                    </div>
                  ) : (
                    <span>{editingItem ? 'Save Changes' : 'Create Dish'}</span>
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
