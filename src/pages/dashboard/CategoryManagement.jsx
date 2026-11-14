import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers, X, Check } from 'lucide-react';
import api from '../../services/api.js';
import { initialIndianCategories, getStored, setStored } from '../../services/dataStore.js';

export default function CategoryManagement() {
  const [categories, setCategories] = useState(() => {
    return getStored('categories', initialIndianCategories);
  });
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    displayOrder: 1,
  });

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map(c => ({
            id: c.id,
            name: c.name,
            itemCount: c.item_count || 4,
            description: c.description || '',
            status: c.is_active ? 'active' : 'inactive',
            displayOrder: c.display_order || 1,
          }));
          setCategories(mapped);
          setStored('categories', mapped);
        }
      } catch {
        // Fallback to local store data
      }
    };
    fetchCats();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
      displayOrder: categories.length + 1,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      status: cat.status || 'active',
      displayOrder: cat.displayOrder || 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure? Dishes in this category may become unassigned.')) {
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      setStored('categories', updated);
      try {
        await api.delete(`/categories/${id}`);
      } catch {
        // offline fallback
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || isSaving) return;

    setIsSaving(true);
    try {
      if (editingCategory) {
        const updated = categories.map((c) =>
          c.id === editingCategory.id ? { ...c, ...formData } : c
        );
        setCategories(updated);
        setStored('categories', updated);

        try {
          await api.put(`/categories/${editingCategory.id}`, formData);
        } catch {
          // offline fallback
        }
      } else {
        const newCat = {
          id: Date.now(),
          ...formData,
          itemCount: 0,
        };
        const updated = [...categories, newCat];
        setCategories(updated);
        setStored('categories', updated);

        try {
          await api.post('/categories', formData);
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
      <div className="page-toolbar">
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>Menu Categories</h3>
          <p style={{ fontSize: '0.825rem', color: '#7c849e', marginTop: '0.2rem' }}>
            Organize digital and POS Indian culinary menu grouping
          </p>
        </div>

        <button className="dash-btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add New Category</span>
        </button>
      </div>

      <div className="dash-table-container">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Items Count</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td style={{ fontWeight: 600, color: '#ff6b35', width: '60px' }}>#{cat.displayOrder}</td>
                <td style={{ fontWeight: 600, color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Layers size={16} color="#ff8555" />
                    <span>{cat.name}</span>
                  </div>
                </td>
                <td style={{ color: '#a8afc4', maxWidth: '350px' }}>{cat.description}</td>
                <td>
                  <span style={{ padding: '0.2rem 0.55rem', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '0.8rem' }}>
                    {cat.itemCount} items
                  </span>
                </td>
                <td>
                  <span className={`badge-status ${cat.status}`}>
                    {cat.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cdd2df', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                      title="Edit Category"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                      title="Delete Category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Modal (Responsive) */}
      {showModal && (
        <div className="dash-modal-overlay">
          <div className="dash-modal" style={{ maxWidth: '500px', width: '95%' }}>
            <div className="dash-modal-header">
              <h3 className="dash-modal-title">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label className="auth-form-label">Category Name *</label>
                <input
                  type="text"
                  className="auth-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. Tandoori Specialities"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="auth-row-2">
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

                <div className="auth-form-group">
                  <label className="auth-form-label">Display Order</label>
                  <input
                    type="number"
                    className="auth-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label">Description</label>
                <textarea
                  className="auth-input"
                  style={{ paddingLeft: '1rem', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Optional brief description..."
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
                      <span>Saving Category...</span>
                    </div>
                  ) : (
                    <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
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
