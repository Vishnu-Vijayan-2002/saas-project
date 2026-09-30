/* ============================================================
   ROUTES — Role-based route configuration
   ============================================================ */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROLES } from '../utils/constants';

// Layouts
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import BusinessAdminLayout from '../layouts/BusinessAdminLayout';
import SalesmanLayout from '../layouts/SalesmanLayout';
import CustomerLayout from '../layouts/CustomerLayout';

// Protected Route
import ProtectedRoute from '../components/common/ProtectedRoute';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Super Admin Pages
import SuperAdminDashboard from '../pages/super-admin/DashboardPage';
import TenantsPage from '../pages/super-admin/TenantsPage';
import PlansPage from '../pages/super-admin/PlansPage';
import SubscriptionsPage from '../pages/super-admin/SubscriptionsPage';
import UsagePage from '../pages/super-admin/UsagePage';
import PlatformSettingsPage from '../pages/super-admin/PlatformSettingsPage';

// Business Admin Pages
import BusinessDashboard from '../pages/business/DashboardPage';
import OrdersPage from '../pages/business/OrdersPage';
import ProductsPage from '../pages/business/ProductsPage';
import CategoriesPage from '../pages/business/CategoriesPage';
import InventoryPage from '../pages/business/InventoryPage';
import CustomersPage from '../pages/business/CustomersPage';
import SalesmenPage from '../pages/business/SalesmenPage';
import CampaignsPage from '../pages/business/CampaignsPage';
import SettingsPage from '../pages/business/SettingsPage';

// Salesman Pages
import SalesmanDashboard from '../pages/salesman/DashboardPage';
import SalesmanHistory from '../pages/salesman/HistoryPage';
import SalesmanProfile from '../pages/salesman/ProfilePage';

// Customer Pages
import CustomerCatalogPage from '../pages/customer/CatalogPage';
import CustomerCartPage from '../pages/customer/CartPage';
import CustomerCheckoutPage from '../pages/customer/CheckoutPage';
import CustomerOrderStatusPage from '../pages/customer/OrderStatusPage';

const router = createBrowserRouter([
  // ---- AUTH ----
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },

  // ---- SUPER ADMIN ----
  {
    path: '/super-admin',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <SuperAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <SuperAdminDashboard /> },
      { path: 'tenants', element: <TenantsPage /> },
      { path: 'plans', element: <PlansPage /> },
      { path: 'subscriptions', element: <SubscriptionsPage /> },
      { path: 'usage', element: <UsagePage /> },
      { path: 'settings', element: <PlatformSettingsPage /> },
    ],
  },

  // ---- BUSINESS ADMIN ----
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.BUSINESS_ADMIN]}>
        <BusinessAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <BusinessDashboard /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'salesmen', element: <SalesmenPage /> },
      { path: 'whatsapp', element: <CampaignsPage /> },
      { path: 'templates', element: <CampaignsPage /> },
      { path: 'campaigns', element: <CampaignsPage /> },
      { path: 'promotions', element: <CampaignsPage /> },
      { path: 'analytics', element: <BusinessDashboard /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },

  // ---- SALESMAN ----
  {
    path: '/salesman',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SALESMAN]}>
        <SalesmanLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <SalesmanDashboard /> },
      { path: 'orders', element: <SalesmanDashboard /> },
      { path: 'history', element: <SalesmanHistory /> },
      { path: 'profile', element: <SalesmanProfile /> },
    ],
  },

  // ---- CUSTOMER ORDERING ----
  {
    path: '/order/:tenantId',
    element: <CustomerLayout />,
    children: [
      { index: true, element: <CustomerCatalogPage /> },
      { path: 'cart', element: <CustomerCartPage /> },
      { path: 'checkout', element: <CustomerCheckoutPage /> },
      { path: 'status/:orderId', element: <CustomerOrderStatusPage /> },
      { path: 'confirmation/:orderId', element: <CustomerOrderStatusPage /> },
    ],
  },

  // ---- CATCH ALL ----
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

/* ---- PLACEHOLDER PAGE — for routes to be built in later phases ---- */
function PlaceholderPage({ title }) {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1 className="page-header__title">{title}</h1>
          <p className="page-header__description">This section will be built in a subsequent phase.</p>
        </div>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)', opacity: 0.3 }}>🚧</div>
        <h3 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
          Coming Soon
        </h3>
        <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
          The {title} module is scheduled for a later development phase.
        </p>
      </div>
    </div>
  );
}

/* ---- 404 PAGE ---- */
function NotFoundPage() {
  return (
    <div className="auth-layout">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 800, marginBottom: 'var(--space-4)' }}>
          404
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
          Page not found
        </p>
        <a href="/login" className="btn btn-primary">
          Go to Login
        </a>
      </div>
    </div>
  );
}

export default router;
