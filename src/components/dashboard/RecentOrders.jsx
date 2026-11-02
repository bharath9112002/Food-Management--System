import { formatINR } from '../../data/dashboardData'

const STATUS_CLASS = {
  Preparing: 'warning',
  'On the way': 'info',
  Delivered: 'good',
  Cancelled: 'critical',
}

export default function RecentOrders({ orders }) {
  return (
    <section className="panel" aria-labelledby="orders-title">
      <div className="panel-head">
        <div>
          <h2 id="orders-title">Recent Orders</h2>
          <p className="panel-sub">Latest {orders.length} orders across all restaurants</p>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table orders-table">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Restaurant</th>
              <th scope="col" className="num">Items</th>
              <th scope="col" className="num">Amount</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td data-label="Order">
                  <span className="order-id">{o.id}</span>
                  <span className="order-time">{o.time}</span>
                </td>
                <td data-label="Customer">{o.customer}</td>
                <td data-label="Restaurant">{o.restaurant}</td>
                <td data-label="Items" className="num">{o.items}</td>
                <td data-label="Amount" className="num">{formatINR(o.amount)}</td>
                <td data-label="Status">
                  <span className={`status-badge ${STATUS_CLASS[o.status]}`}>
                    <span className="status-dot" aria-hidden="true" />
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
