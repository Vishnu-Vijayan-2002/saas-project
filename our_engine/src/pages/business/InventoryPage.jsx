/* ============================================================
   INVENTORY PAGE — Real-time Stock Management & Audit Trail
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { subscribeToProducts } from '../../services/productService';
import { updateStock, adjustStock, subscribeToInventoryLogs } from '../../services/inventoryService';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';

export default function InventoryPage() {
  const { tenantId } = useTenant();
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, LOW_STOCK, OUT_OF_STOCK

  // Stock Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState('ADD'); // ADD, SUBTRACT, SET
  const [reason, setReason] = useState('RESTOCK');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    const unsubProducts = subscribeToProducts(tenantId, (prods) => {
      setProducts(prods);
      setLoading(false);
    });

    const unsubLogs = subscribeToInventoryLogs(tenantId, (inventoryLogs) => {
      setLogs(inventoryLogs);
    });

    return () => {
      unsubProducts();
      unsubLogs();
    };
  }, [tenantId]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const isOut = (p.stock || 0) <= 0;
    const isLow = (p.stock || 0) <= (p.lowStockThreshold || 10);

    if (stockFilter === 'OUT_OF_STOCK') return matchesSearch && isOut;
    if (stockFilter === 'LOW_STOCK') return matchesSearch && isLow;
    return matchesSearch;
  });

  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const outOfStockCount = products.filter((p) => (p.stock || 0) <= 0).length;
  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= (p.lowStockThreshold || 10)).length;

  const handleQuickAdjust = async (product, delta) => {
    try {
      await adjustStock(tenantId, product.id, delta, delta > 0 ? 'QUICK_ADD' : 'QUICK_DEDUCT');
      showSuccess(`Stock adjusted: ${delta > 0 ? '+' : ''}${delta} for ${product.name}`);
    } catch (err) {
      showError('Failed to adjust stock.');
    }
  };

  const handleOpenAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustmentAmount(10);
    setAdjustmentType('ADD');
    setReason('RESTOCK');
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      if (adjustmentType === 'SET') {
        await updateStock(tenantId, selectedProduct.id, Number(adjustmentAmount), reason);
      } else {
        const delta = adjustmentType === 'ADD' ? Number(adjustmentAmount) : -Number(adjustmentAmount);
        await adjustStock(tenantId, selectedProduct.id, delta, reason);
      }
      showSuccess(`Updated stock for ${selectedProduct.name}`);
      setSelectedProduct(null);
    } catch (err) {
      showError(err.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading inventory records..." />;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Inventory & Stock Management"
        description="Monitor stock counts, record restocks, and review real-time inventory change logs."
      />

      {/* Metrics Grid */}
      <div className="stats-grid mb-6">
        <StatCard
          title="Total Stock on Hand"
          value={totalStockUnits}
          subtitle="Total product units tracked"
          variant="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          }
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          subtitle="Need replenishment soon"
          variant="warning"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockCount}
          subtitle="Unavailable for order"
          variant={outOfStockCount > 0 ? 'danger' : 'success'}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-6" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search product stock by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
              🔍
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn ${stockFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStockFilter('ALL')}
            >
              All Items
            </button>
            <button
              className={`btn ${stockFilter === 'LOW_STOCK' ? 'btn-warning' : 'btn-secondary'}`}
              onClick={() => setStockFilter('LOW_STOCK')}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              className={`btn ${stockFilter === 'OUT_OF_STOCK' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setStockFilter('OUT_OF_STOCK')}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="card mb-6" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Stock Status</th>
              <th>Available Units</th>
              <th>Threshold</th>
              <th>Quick Adjust</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              const isOut = (p.stock || 0) <= 0;
              const isLow = !isOut && (p.stock || 0) <= (p.lowStockThreshold || 10);

              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          📦
                        </div>
                      )}
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td>{p.categoryName || '—'}</td>
                  <td>
                    {isOut ? (
                      <span className="badge badge-danger">Out of Stock</span>
                    ) : isLow ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">In Stock</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'inherit' }}>
                      {p.stock ?? 0}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{p.lowStockThreshold || 10}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleQuickAdjust(p, -1)}
                        disabled={(p.stock || 0) <= 0}
                      >
                        -1
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleQuickAdjust(p, 1)}
                      >
                        +1
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleQuickAdjust(p, 10)}
                      >
                        +10
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                      onClick={() => handleOpenAdjustModal(p)}
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Inventory Movement Log */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Stock Movements</h3>
        {logs.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            No recent stock changes logged yet.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Product ID</th>
                <th>Movement Type</th>
                <th>Units</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 10).map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(log.timestamp)}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.productId}</td>
                  <td>
                    <span className={`badge ${log.type === 'SET' ? 'badge-info' : log.delta > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {log.type === 'SET' ? 'Stock Set' : log.delta > 0 ? 'Restock (+)' : 'Deduction (-)'}
                    </span>
                  </td>
                  <td>
                    <strong>{log.type === 'SET' ? log.newStock : log.delta}</strong>
                  </td>
                  <td>{log.reason || 'Manual Adjustment'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Adjust Stock: {selectedProduct.name}</h3>
              <button className="btn-close" onClick={() => setSelectedProduct(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label">Current Stock: </label>
                  <strong style={{ fontSize: '1.1rem', marginLeft: '0.5rem' }}>{selectedProduct.stock ?? 0} units</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Type</label>
                  <select
                    className="form-control"
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                  >
                    <option value="ADD">Add Stock (+)</option>
                    <option value="SUBTRACT">Deduct Stock (-)</option>
                    <option value="SET">Set Exact Count (=)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <select className="form-control" value={reason} onChange={(e) => setReason(e.target.value)}>
                    <option value="RESTOCK">Supplier Restock</option>
                    <option value="MANUAL_COUNT">Inventory Count / Audit</option>
                    <option value="DAMAGED">Damaged / Expired</option>
                    <option value="RETURN">Customer Return</option>
                    <option value="OTHER">Other Reason</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedProduct(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Applying...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
