/* ============================================================
   CUSTOMER LAYOUT — Mobile-first premium layout for ordering flow
   ============================================================ */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';

export default function CustomerLayout() {
  return (
    <CartProvider>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0d14',
          color: 'var(--color-text-primary)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </div>
    </CartProvider>
  );
}
