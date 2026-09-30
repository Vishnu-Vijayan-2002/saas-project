/* ============================================================
   CATEGORIES PAGE — Category & Menu Hierarchy Management
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import {
  subscribeToCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/categoryService';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function CategoriesPage() {
  const { tenantId } = useTenant();
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    color: '#3b82f6',
    status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    const unsub = subscribeToCategories(tenantId, (cats) => {
      setCategories(cats);
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId]);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name || '',
        description: cat.description || '',
        sortOrder: cat.sortOrder || 0,
        color: cat.color || '#3b82f6',
        status: cat.status || 'ACTIVE',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        sortOrder: categories.length + 1,
        color: '#3b82f6',
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(tenantId, editingCategory.id, formData);
        showSuccess('Category updated.');
      } else {
        await createCategory(tenantId, formData);
        showSuccess('Category created.');
      }
      setIsModalOpen(false);
    } catch (err) {
      showError(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory(tenantId, deletingCategory.id);
      showSuccess('Category deleted.');
      setDeletingCategory(null);
    } catch (err) {
      showError('Failed to delete category.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading categories..." />;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Menu Categories"
        description="Organize food, beverage, and merchandise categories for your catalog."
        actions={
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Category
          </button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon="tag"
          title="No categories yet"
          description="Create categories like Popcorn, Beverages, Combos, or Merchandise to organize your products."
          action={
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              Add First Category
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {categories.map((cat) => (
            <div key={cat.id} className="card" style={{ padding: '1.25rem', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: cat.color || '#3b82f6',
                    display: 'inline-block',
                  }}
                />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, flex: 1 }}>{cat.name}</h3>
                <span className="badge badge-default" style={{ fontSize: '0.75rem' }}>
                  Order: {cat.sortOrder || 0}
                </span>
              </div>

              {cat.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  {cat.description}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={() => handleOpenModal(cat)}>
                  Edit
                </button>
                <button className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setDeletingCategory(cat)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Snacks & Popcorn"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Accent Color</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        style={{ width: '42px', height: '38px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{formData.color}</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Brief description of items in this category"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingCategory && (
        <ConfirmModal
          isOpen={true}
          title="Delete Category"
          message={`Are you sure you want to delete category "${deletingCategory.name}"? Products in this category will become unassigned.`}
          confirmText="Delete Category"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
}
