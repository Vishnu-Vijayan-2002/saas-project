/* ============================================================
   PERMISSIONS — Role-based permission helpers
   ============================================================ */

import { ROLES } from './constants.js';

/**
 * Permission definitions by role.
 * Each key is a permission name, each value is an array of roles that have it.
 */
const PERMISSION_MAP = {
  // Tenant management
  'tenants.create': [ROLES.SUPER_ADMIN],
  'tenants.edit': [ROLES.SUPER_ADMIN],
  'tenants.activate': [ROLES.SUPER_ADMIN],
  'tenants.suspend': [ROLES.SUPER_ADMIN],
  'tenants.view': [ROLES.SUPER_ADMIN],
  'tenants.viewAll': [ROLES.SUPER_ADMIN],

  // Plans and subscriptions
  'plans.manage': [ROLES.SUPER_ADMIN],
  'subscriptions.manage': [ROLES.SUPER_ADMIN],
  'usage.view': [ROLES.SUPER_ADMIN],

  // Platform analytics
  'platform.analytics': [ROLES.SUPER_ADMIN],
  'platform.settings': [ROLES.SUPER_ADMIN],

  // Business profile
  'business.profile.view': [ROLES.BUSINESS_ADMIN],
  'business.profile.edit': [ROLES.BUSINESS_ADMIN],
  'business.branding.edit': [ROLES.BUSINESS_ADMIN],
  'business.settings.edit': [ROLES.BUSINESS_ADMIN],

  // Products
  'products.view': [ROLES.BUSINESS_ADMIN, ROLES.SALESMAN, ROLES.CUSTOMER],
  'products.create': [ROLES.BUSINESS_ADMIN],
  'products.edit': [ROLES.BUSINESS_ADMIN],
  'products.delete': [ROLES.BUSINESS_ADMIN],

  // Categories
  'categories.view': [ROLES.BUSINESS_ADMIN, ROLES.CUSTOMER],
  'categories.manage': [ROLES.BUSINESS_ADMIN],

  // Inventory
  'inventory.view': [ROLES.BUSINESS_ADMIN],
  'inventory.manage': [ROLES.BUSINESS_ADMIN],

  // Customers
  'customers.view': [ROLES.BUSINESS_ADMIN],
  'customers.manage': [ROLES.BUSINESS_ADMIN],

  // Salesmen
  'salesmen.view': [ROLES.BUSINESS_ADMIN],
  'salesmen.manage': [ROLES.BUSINESS_ADMIN],

  // Orders
  'orders.viewAll': [ROLES.BUSINESS_ADMIN],
  'orders.viewAssigned': [ROLES.SALESMAN],
  'orders.viewOwn': [ROLES.CUSTOMER],
  'orders.create': [ROLES.CUSTOMER, ROLES.BUSINESS_ADMIN],
  'orders.updateStatus': [ROLES.BUSINESS_ADMIN],
  'orders.assignSalesman': [ROLES.BUSINESS_ADMIN],
  'orders.cancel': [ROLES.BUSINESS_ADMIN, ROLES.CUSTOMER],

  // Delivery
  'delivery.update': [ROLES.SALESMAN],
  'delivery.viewHistory': [ROLES.SALESMAN, ROLES.BUSINESS_ADMIN],

  // Payments
  'payments.view': [ROLES.BUSINESS_ADMIN],
  'payments.viewStatus': [ROLES.SALESMAN],

  // Refunds
  'refunds.create': [ROLES.BUSINESS_ADMIN],
  'refunds.view': [ROLES.BUSINESS_ADMIN],

  // WhatsApp
  'whatsapp.config': [ROLES.BUSINESS_ADMIN],
  'whatsapp.templates': [ROLES.BUSINESS_ADMIN],
  'whatsapp.messages': [ROLES.BUSINESS_ADMIN],

  // Campaigns
  'campaigns.view': [ROLES.BUSINESS_ADMIN],
  'campaigns.create': [ROLES.BUSINESS_ADMIN],
  'campaigns.manage': [ROLES.BUSINESS_ADMIN],

  // Movie promotions
  'promotions.view': [ROLES.BUSINESS_ADMIN, ROLES.CUSTOMER],
  'promotions.manage': [ROLES.BUSINESS_ADMIN],

  // Analytics
  'analytics.view': [ROLES.BUSINESS_ADMIN],

  // Audit
  'audit.view': [ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN],
};

/**
 * Check if a role has a specific permission.
 * @param {string} role - User role
 * @param {string} permission - Permission name
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const allowedRoles = PERMISSION_MAP[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * Get all permissions for a given role.
 * @param {string} role - User role
 * @returns {string[]}
 */
export function getPermissionsForRole(role) {
  return Object.entries(PERMISSION_MAP)
    .filter(([, roles]) => roles.includes(role))
    .map(([permission]) => permission);
}

/**
 * Check if a role is an admin-level role.
 * @param {string} role - User role
 * @returns {boolean}
 */
export function isAdminRole(role) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.BUSINESS_ADMIN;
}

/**
 * Get the default redirect path for a role after login.
 * @param {string} role - User role
 * @returns {string}
 */
export function getDefaultRouteForRole(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return '/super-admin/dashboard';
    case ROLES.BUSINESS_ADMIN:
      return '/admin/dashboard';
    case ROLES.SALESMAN:
      return '/salesman/dashboard';
    case ROLES.CUSTOMER:
      return '/';
    default:
      return '/login';
  }
}

/**
 * Navigation items based on role.
 * @param {string} role - User role
 * @returns {Array<{ label: string, path: string, icon: string }>}
 */
export function getNavigationForRole(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return [
        { label: 'Overview', path: '/super-admin/dashboard', icon: 'dashboard' },
        { label: 'Tenants', path: '/super-admin/tenants', icon: 'business' },
        { label: 'Plans', path: '/super-admin/plans', icon: 'payments' },
        { label: 'Subscriptions', path: '/super-admin/subscriptions', icon: 'receipt' },
        { label: 'Usage', path: '/super-admin/usage', icon: 'analytics' },
        { label: 'Settings', path: '/super-admin/settings', icon: 'settings' },
      ];
    case ROLES.BUSINESS_ADMIN:
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
        { label: 'Orders', path: '/admin/orders', icon: 'orders' },
        { label: 'Products', path: '/admin/products', icon: 'products' },
        { label: 'Categories', path: '/admin/categories', icon: 'categories' },
        { label: 'Inventory', path: '/admin/inventory', icon: 'inventory' },
        { label: 'Customers', path: '/admin/customers', icon: 'people' },
        { label: 'Salesmen', path: '/admin/salesmen', icon: 'badge' },
        { label: 'WhatsApp', path: '/admin/whatsapp', icon: 'whatsapp' },
        { label: 'Templates', path: '/admin/templates', icon: 'template' },
        { label: 'Campaigns', path: '/admin/campaigns', icon: 'campaign' },
        { label: 'Promotions', path: '/admin/promotions', icon: 'movie' },
        { label: 'Analytics', path: '/admin/analytics', icon: 'chart' },
        { label: 'Settings', path: '/admin/settings', icon: 'settings' },
      ];
    case ROLES.SALESMAN:
      return [
        { label: 'Dashboard', path: '/salesman/dashboard', icon: 'dashboard' },
        { label: 'Orders', path: '/salesman/orders', icon: 'orders' },
        { label: 'History', path: '/salesman/history', icon: 'history' },
        { label: 'Profile', path: '/salesman/profile', icon: 'person' },
      ];
    default:
      return [];
  }
}
