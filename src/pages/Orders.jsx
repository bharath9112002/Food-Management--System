import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/orders/StatusBadge'
import { FALLBACK_IMAGE, handleImageError } from '../components/menu/image'
import { StateMessage } from '../components/restaurants/StateMessage'
import { useOrders } from '../context/OrdersContext'
import { formatINR } from '../data/dashboardData'
import { useNow } from '../hooks/useNow'
import { getSchedule, getStatus, STATUS } from '../utils/orders'

const TABS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'active', label: 'Active', match: (s) => s !== STATUS.DELIVERED && s !== STATUS.CANCELLED },
  { key: 'delivered', label: 'Delivered', match: (s) => s === STATUS.DELIVERED },
  { key: 'cancelled', label: 'Cancelled', match: (s) => s === STATUS.CANCELLED },
]

const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export default function Orders() {
  const { orders } = useOrders()
  const now = useNow(10000)
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')

  const withStatus = orders.map((o) => ({ order: o, status: getStatus(o, now) }))
  const counts = Object.fromEntries(TABS.map((t) => [t.key, withStatus.filter((o) => t.match(o.status)).length]))

  const q = query.trim().toLowerCase()
  const visible = withStatus.filter(
    ({ order, status }) =>
      TABS.find((t) => t.key === tab).match(status) &&
      (!q || order.id.toLowerCase().includes(q) || order.items.some((i) => i.name.toLowerCase().includes(q))),
  )

  if (orders.length === 0) {
    return (
      <main className="dashboard">
        <div className="page-head">
          <h1>My Orders</h1>
        </div>
        <StateMessage
          icon="🧾"
          title="No orders yet"
          message="When you place an order, you can track it here."
          action={
            <Link to="/menu" className="btn-primary btn-inline btn-link">
              Browse menu
            </Link>
          }
        />
      </main>
    )
  }

  return (
    <main className="dashboard orders-page">
      <div className="page-head">
        <div>
          <h1>My Orders</h1>
          <p>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} · {counts.active} active
          </p>
        </div>
      </div>

      <section className="filters panel" aria-label="Filter orders">
        <div className="search-box">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search by order ID or dish…"
            aria-label="Search orders"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="category-chips" role="group" aria-label="Order status">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className="chip"
              aria-pressed={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label} <span className="chip-count">{counts[t.key]}</span>
            </button>
          ))}
        </div>
      </section>

      {visible.length === 0 ? (
        <StateMessage icon="🔎" title="No matching orders" message="Try another tab or search term." />
      ) : (
        <ul className="order-list">
          {visible.map(({ order, status }) => {
            const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0)
            const deliverAt = getSchedule(order)[STATUS.DELIVERED]
            const active = status !== STATUS.DELIVERED && status !== STATUS.CANCELLED
            return (
              <li key={order.id}>
                <Link to={`/orders/${order.id}`} className="order-card">
                  <div className="order-thumbs" aria-hidden="true">
                    {order.items.slice(0, 3).map((i) => (
                      <img key={i.id} src={i.image || FALLBACK_IMAGE} alt="" onError={handleImageError} />
                    ))}
                  </div>

                  <div className="order-card-main">
                    <div className="order-card-head">
                      <strong className="mono">{order.id}</strong>
                      <StatusBadge status={status} />
                    </div>
                    <p className="order-card-items">
                      {order.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}
                    </p>
                    <p className="order-card-meta">
                      {new Date(order.placedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} · <strong>{formatINR(order.summary.total)}</strong>
                    </p>
                  </div>

                  <div className="order-card-side">
                    {active ? (
                      <span className="order-eta">
                        🛵 Arriving by <strong>{formatTime(deliverAt)}</strong>
                      </span>
                    ) : status === STATUS.DELIVERED ? (
                      <span className="order-eta muted">Delivered at {formatTime(deliverAt)}</span>
                    ) : (
                      <span className="order-eta muted">Cancelled</span>
                    )}
                    <span className="order-track">{active ? 'Track order →' : 'View details →'}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
