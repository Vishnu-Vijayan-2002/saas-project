/* ============================================================
   PROTECTED ROUTE — Role-based route guard
   ============================================================ */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route guard that checks authentication and role.
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} props.allowedRoles - Roles allowed to access this route
 * @param {string} props.redirectTo - Redirect path if unauthorized
 */
export default function ProtectedRoute({ children, allowedRoles = [], redirectTo = '/login' }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullPage text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to the user's correct dashboard instead of showing unauthorized
    const roleRedirects = {
      SUPER_ADMIN: '/super-admin/dashboard',
      BUSINESS_ADMIN: '/admin/dashboard',
      SALESMAN: '/salesman/dashboard',
      CUSTOMER: '/',
    };
    const correctPath = roleRedirects[user.role] || '/login';
    return <Navigate to={correctPath} replace />;
  }

  return children;
}
