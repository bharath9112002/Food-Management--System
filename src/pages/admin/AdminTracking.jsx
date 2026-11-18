import { Link } from 'react-router-dom'
import { NEXT_ACTION, useAdminOrderActions } from '../../components/admin/useAdminOrderActions'
import { formatINR } from '../../data/dashboardData'
import { useAdminData } from '../../hooks/useAdminData'
import { ADMIN_CANCELLABLE, getSchedule, getStatus, STATUS } from '../../utils/orders'

const COLUMNS = [
  { status: STATUS.PLACED, title: 'New orders', icon: '🧾' },
  { status: STATUS.PREPARING, title: 'Preparing', icon: '👨‍🍳' },
  { status: STATUS.OUT, title: 'Out for delivery', icon: '🛵' },
]

const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export default function AdminTracking() {
  const { orders, now } = useAdminData()
  const actions = useAdminOrderActions()

  const withStatus = orders.map((o) => ({ order: o, status: getStatus(o, now) }))
  const startOfDay = new Date(now).setHours(0, 0, 0, 0)
  const today = withStatus.filter(({ order }) => new Date(order.placedAt).getTime() >= startOfDay)
  const deliveredToday = today.filter(({ status }) => status === STATUS.DELIVERED)
  const kpis = [
    { label: 'Active now', value: withStatus.filter(({ status }) => COLUMNS.some((c) => c.status === status)).length },
    { label: 'Orders today', value: today.length },
    { label: 'Delivered today', value: deliveredToday.length },
    { label: 'Revenue today', value: formatINR(deliveredToday.reduce((s, { order }) => s + order.summary.total, 0)) },
  ]

  return (
    <main className="dashboard admin-page">
      <div className="page-head">
        <div>
          <h1>Order Tracking</h1>
          <p>Live board of every active order. Statuses also advance automatically over time.</p>
        </div>
        <span className="live-pill">
          <span className="live-dot" aria-hidden="true" /> Live
        </span>
      </div>

      <dl className="admin-kpis">
        {kpis.map((k) => (
          <div key={k.label}>
            <dt>{k.label}</dt>
            <dd>{k.value}</dd>
          </div>
        ))}
      </dl>

      <div className="kanban">
        {COLUMNS.map((col) => {
          const cards = withStatus.filter(({ status }) => status === col.status)
          return (
            <section key={col.status} className="kanban-col" aria-labelledby={`col-${col.status}`}>
              <h2 id={`col-${col.status}`}>
                <span aria-hidden="true">{col.icon}</span> {col.title}
                <span className="chip-count">{cards.length}</span>
              </h2>
              {cards.length === 0 ? (
                <p className="kanban-empty">Nothing here</p>
              ) : (
                <ul>
                  {cards.map(({ order, status }) => {
                    const next = NEXT_ACTION[status]
                    const deliverAt = getSchedule(order)[STATUS.DELIVERED]
                    const late = now > new Date(order.estimatedDeliveryAt).getTime()
                    return (
                      <li key={order.id} className="kanban-card">
                        <div className="kanban-card-head">
                          <Link to={`/admin/orders/${order.id}`} className="mono">
                            {order.id}
                          </Link>
                          <span className={`eta-chip${late ? ' late' : ''}`}>
                            {late ? 'Late · ' : 'ETA '}
                            {formatTime(deliverAt)}
                          </span>
                        </div>
                        <p className="kanban-customer">
                          {order.customer.name} · {order.address.city}
                        </p>
                        <p className="kanban-items">{order.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p>
                        <div className="kanban-foot">
                          <strong>{formatINR(order.summary.total)}</strong>
                          <span className="muted">{order.paymentInfo?.status === 'Paid' ? 'Prepaid' : 'COD'}</span>
                        </div>
                        <div className="kanban-actions">
                          {next && (
                            <button type="button" className="btn-demo" onClick={() => actions.moveTo(order, next.target)}>
                              {next.label} →
                            </button>
                          )}
                          {ADMIN_CANCELLABLE.includes(status) && (
                            <button type="button" className="link-btn danger-link" onClick={() => actions.askCancel(order)}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <p className="muted board-note">
        Delivered and cancelled orders move to <Link to="/admin/orders">Order History</Link>.
      </p>

      {actions.elements}
    </main>
  )
}
