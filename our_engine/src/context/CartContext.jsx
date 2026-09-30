/* ============================================================
   CART CONTEXT — State management for customer ordering
   ============================================================ */

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = sessionStorage.getItem('our_engine_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customerInfo, setCustomerInfo] = useState(() => {
    try {
      const saved = sessionStorage.getItem('our_engine_customer');
      return saved ? JSON.parse(saved) : { name: '', phone: '', email: '' };
    } catch {
      return { name: '', phone: '', email: '' };
    }
  });

  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const saved = sessionStorage.getItem('our_engine_location');
      return saved ? JSON.parse(saved) : { type: 'seat', seatNumber: '', tableName: '' };
    } catch {
      return { type: 'seat', seatNumber: '', tableName: '' };
    }
  });

  // Sync to session storage
  useEffect(() => {
    sessionStorage.setItem('our_engine_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    sessionStorage.setItem('our_engine_customer', JSON.stringify(customerInfo));
  }, [customerInfo]);

  useEffect(() => {
    sessionStorage.setItem('our_engine_location', JSON.stringify(deliveryLocation));
  }, [deliveryLocation]);

  const addItem = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl || '',
          quantity,
        },
      ];
    });
  };

  const removeItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    sessionStorage.removeItem('our_engine_cart');
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        customerInfo,
        setCustomerInfo,
        deliveryLocation,
        setDeliveryLocation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
