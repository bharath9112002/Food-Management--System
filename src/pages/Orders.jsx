import { useState } from 'react'
import { Link } from 'react-router-dom'
import InvoiceModal from '../components/orders/InvoiceModal'
import StatusBadge from '../components/orders/StatusBadge'
import { FALLBACK_IMAGE, handleImageError } from '../components/menu/image'
import { StateMessage } from '../components/restaurants/StateMessage'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../context/OrdersContext'
import { formatINR } from '../data/dashboardData'
import { useNow } from '../hooks/useNow'
import { useReorder } from '../hooks/useReorder'
import { useToast } from '../hooks/useToast'
import { getSchedule, getStatus, STATUS } from '../utils/orders'

const TABS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'active', label: 'Active', match: (s) => s !== STATUS.DELIVERED && s !== STATUS.CANCELLED },
  { key: 'delivered', label: 'Delivered', match: (s) => s === STATUS.DELIVERED },
  { key: 'cancelled', label: 'Cancelled', match: (s) => s === STATUS.CANCELLED },
]

const SORTS = {
  newest: { label: 'Newest first', compare: (a, b) => new Date(b.order.placedAt) - new Date(a.order.placedAt) },
  oldest: { label: 'Oldest first', compare: (a, b) => new Date(a.order.placedAt) - new Date(b.order.placedAt) },
  amount: { label: 'Amount: high to low', compare: (a, b) => b.order.summary.total - a.order.summary.total },
}

const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export default function Orders() {
  const { orders } = useOrders()
  const now = useNow(10000)
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [invoiceOrder, setInvoiceOrder] = useState(null)
  const { user } = useAuth()
  const [toastEl, showToast] = useToast()
  const reorder = useReorder(() => showToast('None of these dishes are available right now', 'warning'))

  const withStatus = orders.map((o) => ({ order: o, status: getStatus(o, now) }))
  const counts = Object.fromEntries(TABS.map((t) => [t.key, withStatus.filter((o) => t.match(o.status)).length]))

  const q = query.trim().toLowerCase()
  const visible = withStatus.filter(
    ({ order, status }) =>
      TABS.find((t) => t.key === tab).match(status) &&
      (!q || order.id.toLowerCase().includes(q) || order.items.some((i) => i.name.toLowerCase().includes(q))),
  ).sort(SORTS[sort].compare)

  if (orders.length === 0) {
    return (
      <main className="dashboard">
        <div className="page-head">
          <h1>Order History</h1>
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
          <h1>Order History</h1>
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
        <div className="history-filters">
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
        <label className="select-field inline-select">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </label>
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
              <li key={order.id} className="order-card">
                <Link to={`/orders/${order.id}`} className="order-card-link">
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
                  </div>
                </Link>

                <div className="order-card-actions">
                  <button type="button" className="btn-secondary" onClick={() => setInvoiceOrder(order)}>
                    🧾 Invoice
                  </button>
                  {!active && (
                    <button type="button" className="btn-secondary" onClick={() => reorder(order)}>
                      🔁 Reorder
                    </button>
                  )}
                  <Link to={`/orders/${order.id}`} className="btn-primary btn-inline btn-link">
                    {active ? '📍 Track order' : 'View details'}
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <InvoiceModal order={invoiceOrder} customer={user} onClose={() => setInvoiceOrder(null)} />
      {toastEl}
    </main>
  )
}
