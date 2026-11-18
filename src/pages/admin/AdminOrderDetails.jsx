import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { NEXT_ACTION, useAdminOrderActions } from '../../components/admin/useAdminOrderActions'
import Avatar from '../../components/Avatar'
import { formatAddress } from '../../components/checkout/address'
import { BillDetails, OrderItemList } from '../../components/checkout/OrderItems'
import InvoiceModal from '../../components/orders/InvoiceModal'
import StatusBadge from '../../components/orders/StatusBadge'
import TrackingTimeline from '../../components/orders/TrackingTimeline'
import { StateMessage } from '../../components/restaurants/StateMessage'
import { formatINR } from '../../data/dashboardData'
import { useAdminData } from '../../hooks/useAdminData'
import { ADMIN_CANCELLABLE, FLOW, getRider, getSchedule, getStatus, STATUS } from '../../utils/orders'

const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export default function AdminOrderDetails() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { orders, now } = useAdminData()
  const actions = useAdminOrderActions()
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  // Message handed over by the Place Order page.
  const { showToast } = actions
  useEffect(() => {
    if (!location.state?.toast) return
    showToast(location.state.toast)
    navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate, showToast])

  const order = orders.find((o) => o.id === id)

  if (!order) {
    return (
      <main className="dashboard">
        <Link to="/admin/orders" className="back-link">← Order history</Link>
        <StateMessage icon="🔎" title="Order not found" message="No customer has an order with this ID." />
        {actions.elements}
      </main>
    )
  }

  const status = getStatus(order, now)
  const next = NEXT_ACTION[status]
  const currentIndex = FLOW.indexOf(status)
  const schedule = getSchedule(order)
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0)
  const rider = getRider(order.id)

  return (
    <main className="dashboard admin-page">
      <div className="admin-detail-nav">
        <Link to="/admin/tracking" className="back-link">← Tracking board</Link>
        <Link to="/admin/orders" className="back-link">Order history →</Link>
      </div>

      <section className="panel admin-order-head">
        <div>
          <span className="track-label">Order</span>
          <h1 className="mono">{order.id}</h1>
          <p className="muted">
            Placed {new Date(order.placedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            {order.placedBy && <> · 📞 by {order.placedBy.name}</>}
          </p>
        </div>
        <div className="admin-order-status">
          <StatusBadge status={status} />
          <button type="button" className="link-btn" onClick={() => setInvoiceOpen(true)}>
            🧾 Invoice
          </button>
          {status !== STATUS.CANCELLED && status !== STATUS.DELIVERED && (
            <span className="muted">ETA {formatTime(schedule[STATUS.DELIVERED])}</span>
          )}
        </div>
      </section>

      {status !== STATUS.CANCELLED && (
        <section className="panel" aria-labelledby="status-control">
          <h2 id="status-control">Update status</h2>
          <div className="status-stepper" role="group" aria-label="Set order status">
            {FLOW.map((step, i) => (
              <button
                key={step}
                type="button"
                className={i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''}
                disabled={i <= currentIndex}
                aria-current={i === currentIndex ? 'step' : undefined}
                onClick={() => actions.moveTo(order, step)}
              >
                <span aria-hidden="true">{i < currentIndex ? '✓' : i + 1}</span>
                {step}
              </button>
            ))}
          </div>
          <div className="track-actions">
            {next && (
              <button type="button" className="btn-primary btn-inline" onClick={() => actions.moveTo(order, next.target)}>
                {next.label}
              </button>
            )}
            {ADMIN_CANCELLABLE.includes(status) && (
              <button type="button" className="btn-secondary danger" onClick={() => actions.askCancel(order)}>
                Cancel order
              </button>
            )}
          </div>
        </section>
      )}

      <div className="details-grid">
        <section className="panel" aria-labelledby="admin-timeline">
          <h2 id="admin-timeline">Timeline</h2>
          <TrackingTimeline order={order} status={status} />
          {order.cancelledBy && (
            <p className="muted cancel-by">
              Cancelled by {order.cancelledBy === 'restaurant' ? 'the restaurant' : 'the customer'}.
              {order.refund && ` Refund of ${formatINR(order.refund.amount)} initiated.`}
            </p>
          )}
          {status === STATUS.OUT && (
            <div className="rider-card">
              <span className="rider-avatar" aria-hidden="true">🧑‍✈️</span>
              <div>
                <strong>{rider.name}</strong>
                <span>
                  {rider.vehicle} · ★ {rider.rating}
                </span>
              </div>
              <span className="rider-tag">Assigned rider</span>
            </div>
          )}
        </section>

        <div className="track-side">
          <section className="panel">
            <h2>Customer</h2>
            <div className="selected-customer">
              <Avatar user={order.customer} size={44} />
              <div>
                <strong>{order.customer.name}</strong>
                <span>
                  {order.customer.email} · {order.customer.phone}
                </span>
              </div>
            </div>
            <dl className="details-list">
              <div>
                <dt>📍 Deliver to ({order.address.type})</dt>
                <dd>
                  {order.address.fullName} · {order.address.phone}
                  <br />
                  <span className="muted">{formatAddress(order.address)}</span>
                </dd>
              </div>
              <div>
                <dt>💳 Payment</dt>
                <dd>
                  {order.payment}
                  {order.paymentInfo?.txnId && <span className="muted mono"> · {order.paymentInfo.txnId}</span>}
                </dd>
              </div>
              {order.instructions && (
                <div>
                  <dt>📝 Instructions</dt>
                  <dd>{order.instructions}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="panel">
            <h2>Items ({itemCount})</h2>
            <OrderItemList items={order.items} />
            <BillDetails summary={order.summary} itemCount={itemCount} />
          </section>
        </div>
      </div>

      <InvoiceModal order={invoiceOpen ? order : null} customer={order.customer} onClose={() => setInvoiceOpen(false)} />
      {actions.elements}
    </main>
  )
}
