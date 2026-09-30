/* ============================================================
   SALESMAN DELIVERY HISTORY
   ============================================================ */

import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { useSalesmanHistory } from '../../hooks/useOrders';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function HistoryPage() {
  const { orders, loading, error } = useSalesmanHistory();

  return (
    <>
      <PageHeader
        title="Delivery History"
        description="Your past delivered orders"
      />

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="spinner spinner-lg" />
        </div>
      ) : error ? (
        <div className="card text-center p-8">
          <p className="text-error">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="orders"
          title="No delivery history"
          description="Orders you've delivered will appear here."
        />
      ) : (
        <div className="table-container animate-fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Delivered At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>
                    #{order.orderNumber || order.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td>{order.customer?.name || '—'}</td>
                  <td>
                    {order.items?.map((item) => `${item.name} ×${item.quantity}`).join(', ') || '—'}
                  </td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>{formatDate(order.deliveredAt)}</td>
                  <td><StatusBadge type="delivery" status={order.deliveryStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
