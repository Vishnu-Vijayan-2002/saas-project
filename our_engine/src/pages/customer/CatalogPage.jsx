/* ============================================================
   CUSTOMER CATALOG PAGE — Mobile-First Menu & Ordering
   Venue branding, seat/table detection, category browsing, cart badge.
   Upgraded with Premium Rich Aesthetics (Glassmorphism, Animations)
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getTenantPublicInfo } from '../../services/tenantService';
import { subscribeToProducts } from '../../services/productService';
import { subscribeToCategories } from '../../services/categoryService';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CustomerCatalogPage() {
  const { tenantId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { cartItems, addItem, updateQuantity, itemCount, subtotal, setDeliveryLocation, deliveryLocation } = useCart();

  const [tenantInfo, setTenantInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Initialize location from QR scan URL query params
  useEffect(() => {
    const locType = searchParams.get('locationType') || 'seat';
    const locVal = searchParams.get('location') || '';
    if (locVal) {
      setDeliveryLocation({
        type: locType,
        seatNumber: locType === 'seat' ? locVal : '',
        tableName: locType === 'table' ? locVal : '',
        counterNumber: locType === 'counter' ? locVal : '',
      });
    }
  }, [searchParams, setDeliveryLocation]);

  // Load tenant public profile & catalog
  useEffect(() => {
    if (!tenantId) return;

    let isMounted = true;
    setLoading(true);

    getTenantPublicInfo(tenantId).then((info) => {
      if (isMounted) setTenantInfo(info);
    });

    const unsubProducts = subscribeToProducts(tenantId, (prods) => {
      if (isMounted) {
        setProducts(prods.filter((p) => p.status === 'ACTIVE'));
        setLoading(false);
      }
    });

    const unsubCategories = subscribeToCategories(tenantId, (cats) => {
      if (isMounted) setCategories(cats);
    });

    return () => {
      isMounted = false;
      unsubProducts();
      unsubCategories();
    };
  }, [tenantId]);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getItemQuantity = (productId) => {
    const item = cartItems.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading delicious menu..." />;
  }

  const locationDisplay =
    deliveryLocation.seatNumber ? `Seat ${deliveryLocation.seatNumber}` :
    deliveryLocation.tableName ? `Table ${deliveryLocation.tableName}` :
    deliveryLocation.counterNumber ? `Counter ${deliveryLocation.counterNumber}` : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      color: '#fff',
      fontFamily: '"Inter", sans-serif',
      position: 'relative',
      paddingBottom: itemCount > 0 ? '110px' : '30px',
      overflowX: 'hidden' /* Prevents horizontal scroll from background blobs */
    }}>
      {/* Decorative background blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '40%', right: '-10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', zIndex: 0 }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header bar */}
        <div
          style={{
            padding: '1.5rem 1.25rem',
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #e2e8f0, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {tenantInfo?.name || 'Snacks & Beverages'}
              </h1>
              {locationDisplay && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem', padding: '0.2rem 0.6rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <span style={{ fontSize: '0.75rem' }}>📍</span>
                  <span style={{ fontSize: '0.75rem', color: '#c4b5fd', fontWeight: 600 }}>
                    {locationDisplay}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(`/order/${tenantId}/cart`)}
              style={{
                position: 'relative',
                padding: '0.6rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {itemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    border: '2px solid #0f172a'
                  }}
                >
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Input */}
          <div style={{ marginTop: '1rem', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search popcorn, drinks, combos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem 0.85rem 2.75rem',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
            />
            <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '1rem 1.25rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <button
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '24px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: selectedCategory === 'ALL' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(255, 255, 255, 0.05)',
              color: selectedCategory === 'ALL' ? '#fff' : '#cbd5e1',
              boxShadow: selectedCategory === 'ALL' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
            }}
            onClick={() => setSelectedCategory('ALL')}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '24px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: selectedCategory === c.id ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === c.id ? '#fff' : '#cbd5e1',
                boxShadow: selectedCategory === c.id ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
              }}
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products Catalog */}
        <div style={{
          padding: '0 1.25rem 1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem'
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.8 }}>🍿</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0' }}>No items found</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Try a different search or category.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const qty = getItemQuantity(p.id);
              const isOutOfStock = p.stock !== undefined && p.stock <= 0;

              return (
                <div
                  key={p.id}
                  style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '1rem',
                    alignItems: 'center',
                    opacity: isOutOfStock ? 0.6 : 1,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
                    }}
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '2.5rem' }}>🍔</span>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: '#f8fafc', wordBreak: 'break-word', letterSpacing: '-0.01em' }}>
                      {p.name}
                    </h3>
                    {p.description && (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#94a3b8',
                          margin: '0 0 0.5rem 0',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {p.description}
                      </p>
                    )}
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
                      {formatCurrency(p.price)}
                    </div>
                  </div>

                  {/* Add / Qty controls */}
                  <div style={{ flexShrink: 0 }}>
                    {isOutOfStock ? (
                      <span style={{ padding: '0.35rem 0.6rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        Sold Out
                      </span>
                    ) : qty === 0 ? (
                      <button
                        style={{
                          padding: '0.5rem 1.25rem',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          borderRadius: '20px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: '#fff',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                          transition: 'transform 0.1s ease',
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onClick={() => addItem(p)}
                      >
                        Add
                      </button>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          background: 'rgba(59, 130, 246, 0.15)',
                          borderRadius: '20px',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          style={{ padding: '0.35rem 0.5rem', width: '100%', fontSize: '1.2rem', color: '#60a5fa', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          onClick={() => updateQuantity(p.id, qty + 1)}
                        >
                          +
                        </button>
                        <span style={{ fontWeight: 800, padding: '0.1rem 0', fontSize: '1rem', color: '#fff', minWidth: '1.5rem', textAlign: 'center' }}>
                          {qty}
                        </span>
                        <button
                          style={{ padding: '0.35rem 0.5rem', width: '100%', fontSize: '1.4rem', color: '#60a5fa', background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: '1rem' }}
                          onClick={() => updateQuantity(p.id, qty - 1)}
                        >
                          -
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating Bottom Cart Bar */}
        {itemCount > 0 && (
          <div
            style={{
              position: 'fixed',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 2.5rem)',
              maxWidth: '600px',
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              zIndex: 50,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.15rem' }}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </div>
              <strong style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
                {formatCurrency(subtotal)}
              </strong>
            </div>

            <button
              style={{
                padding: '0.75rem 1.75rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '30px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(16, 185, 129, 0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)'; }}
              onClick={() => navigate(`/order/${tenantId}/cart`)}
            >
              Checkout
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
