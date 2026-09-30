/* ============================================================
   PRODUCTS PAGE — Product Catalog Management
   Full CRUD, category filtering, stock adjustments, image upload.
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import {
  subscribeToProducts,
  createProduct,
  updateProduct,
  deactivateProduct,
  uploadProductImage,
} from '../../services/productService';
import { subscribeToCategories } from '../../services/categoryService';
import { formatCurrency } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function ProductsPage() {
  const { tenantId } = useTenant();
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    stock: 0,
    lowStockThreshold: 10,
    imageUrl: '',
    status: 'ACTIVE',
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deletingProduct, setDeletingProduct] = useState(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    const unsubProducts = subscribeToProducts(tenantId, (prods) => {
      setProducts(prods);
      setLoading(false);
    });

    const unsubCategories = subscribeToCategories(tenantId, (cats) => {
      setCategories(cats);
    });

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, [tenantId]);

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeCount = products.filter((p) => p.status === 'ACTIVE').length;
  const lowStockCount = products.filter((p) => (p.stock || 0) <= (p.lowStockThreshold || 10)).length;

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        price: product.price || '',
        stock: product.stock ?? 0,
        lowStockThreshold: product.lowStockThreshold || 10,
        imageUrl: product.imageUrl || '',
        status: product.status || 'ACTIVE',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        price: '',
        stock: 50,
        lowStockThreshold: 10,
        imageUrl: '',
        status: 'ACTIVE',
      });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      showError('Please enter product name and price.');
      return;
    }

    setSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        try {
          const tempId = editingProduct ? editingProduct.id : `prod_${Date.now()}`;
          finalImageUrl = await uploadProductImage(tenantId, tempId, imageFile);
        } catch (imgErr) {
          console.warn('Storage upload error (Storage bucket may be uninitialized):', imgErr.message);
          showError('Note: Image upload skipped because Firebase Storage is not activated yet in Firebase Console.');
        }
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        categoryName: categories.find((c) => c.id === formData.categoryId)?.name || '',
        price: Number(formData.price),
        stock: Number(formData.stock),
        lowStockThreshold: Number(formData.lowStockThreshold),
        imageUrl: finalImageUrl || formData.imageUrl || '',
        status: formData.status,
      };

      if (editingProduct) {
        await updateProduct(tenantId, editingProduct.id, payload);
        showSuccess('Product updated successfully!');
      } else {
        await createProduct(tenantId, payload);
        showSuccess('Product added to catalog!');
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateProduct(tenantId, product.id, { status: nextStatus });
      showSuccess(`Product ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      showError('Failed to change product status.');
    }
  };

  const handleDeactivate = async () => {
    if (!deletingProduct) return;
    try {
      await deactivateProduct(tenantId, deletingProduct.id);
      showSuccess('Product moved to inactive.');
      setDeletingProduct(null);
    } catch (err) {
      showError('Failed to deactivate product.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading product catalog..." />;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Products & Menu"
        description="Manage your items, pricing, stock levels, and food counter catalog."
        actions={
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Product
          </button>
        }
      />

      {/* Metrics Grid */}
      <div className="stats-grid mb-6">
        <StatCard
          title="Total Products"
          value={products.length}
          subtitle="In your business catalog"
          variant="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          title="Active for Sale"
          value={activeCount}
          subtitle="Visible to customers"
          variant="success"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          subtitle="Below restock threshold"
          variant={lowStockCount > 0 ? 'warning' : 'info'}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
        <StatCard
          title="Categories"
          value={categories.length}
          subtitle="Menu sections"
          variant="info"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          }
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-6" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search products by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
              🔍
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: 'auto', minWidth: '160px' }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '140px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon="shopping-bag"
          title="No products found"
          description={
            searchQuery || selectedCategory !== 'ALL'
              ? 'Try adjusting your search or category filters.'
              : 'Add your first item to start receiving customer orders.'
          }
          action={
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              Add Product
            </button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredProducts.map((product) => {
            const isLowStock = (product.stock || 0) <= (product.lowStockThreshold || 10);
            return (
              <div
                key={product.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderColor: isLowStock ? 'rgba(234, 179, 8, 0.4)' : undefined,
                }}
              >
                {/* Image header */}
                <div
                  style={{
                    height: '160px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ fontSize: '3rem', opacity: 0.2 }}>🍔</div>
                  )}

                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                    <StatusBadge status={product.status} type="order" />
                  </div>

                  {product.categoryName && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(4px)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {product.categoryName}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{product.name}</h3>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  {product.description && (
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-text-secondary)',
                        margin: '0 0 1rem 0',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {product.description}
                    </p>
                  )}

                  {/* Stock counter */}
                  <div
                    style={{
                      marginTop: 'auto',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isLowStock ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <span style={{ color: isLowStock ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                      {isLowStock ? '⚠️ Low Stock:' : 'Available Stock:'}
                    </span>
                    <strong style={{ color: isLowStock ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                      {product.stock ?? 0} units
                    </strong>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      onClick={() => handleOpenModal(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      onClick={() => handleToggleStatus(product)}
                      title={product.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      {product.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Cheese Popcorn (Large)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="250.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Initial Stock Count</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="100"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Low Stock Threshold</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="10"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Fresh salted popcorn with real melted butter..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Image File</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                  />
                  <small style={{ color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                    Requires Firebase Storage enabled. Or paste a web image link below.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Or Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      {deletingProduct && (
        <ConfirmModal
          isOpen={true}
          title="Deactivate Product"
          message={`Are you sure you want to deactivate "${deletingProduct.name}"? It will no longer be visible to ordering customers.`}
          confirmText="Deactivate"
          variant="warning"
          onConfirm={handleDeactivate}
          onCancel={() => setDeletingProduct(null)}
        />
      )}
    </div>
  );
}
