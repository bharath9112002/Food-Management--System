import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatAddress } from '../components/checkout/address'
import { BillDetails, OrderItemList } from '../components/checkout/OrderItems'
import Modal from '../components/Modal'
import InvoiceModal from '../components/orders/InvoiceModal'
import StatusBadge from '../components/orders/StatusBadge'
import TrackingTimeline from '../components/orders/TrackingTimeline'
import { StateMessage } from '../components/restaurants/StateMessage'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../context/OrdersContext'
import { useNow } from '../hooks/useNow'
import { useReorder } from '../hooks/useReorder'
import { useToast } from '../hooks/useToast'
import { formatINR } from '../data/dashboardData'
import { METHODS } from '../utils/payment'
import { CANCELLABLE, getNextStatus, getRider, getSchedule, getStatus, STATUS } from '../utils/orders'

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Delivery is taking too long',
  'Want to change items or address',
  'Found a better price elsewhere',
  'Other',
]

const formatTime = (ms) => new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export default function OrderTracking() {
  const { id } = useParams()
  const now = useNow(5000)
  const { getOrder, cancelOrder, advanceOrder } = useOrders()
  const { user } = useAuth()
  const [toastEl, showToast] = useToast()
  const reorder = useReorder(() => showToast('None of these dishes are available right now', 'warning'))
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState(CANCEL_REASONS[0])
  const [otherReason, setOtherReason] = useState('')

  const order = getOrder(id)

  if (!order) {
    return (
      <main className="dashboard">
        <Link to="/orders" className="back-link">← Order history</Link>
        <StateMessage
          icon="🔎"
          title="Order not found"
          message="We couldn't find this order on your account."
          action={
            <Link to="/orders" className="btn-primary btn-inline btn-link">
              View my orders
            </Link>
          }
        />
      </main>
    )
  }

  const status = getStatus(order, now)
  const next = getNextStatus(order, now)
  const schedule = getSchedule(order)
  const placedAt = new Date(order.placedAt).getTime()
  const deliverAt = new Date(schedule[STATUS.DELIVERED]).getTime()
  const minutesLeft = Math.max(1, Math.ceil((deliverAt - now) / 60000))
  const progress = Math.min(100, Math.max(4, ((now - placedAt) / (deliverAt - placedAt)) * 100))
  const canCancel = CANCELLABLE.includes(status)
  const isActive = status !== STATUS.DELIVERED && status !== STATUS.CANCELLED
  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0)
  const rider = getRider(order.id)

  function handleCancel(e) {
    e.preventDefault()
    const finalReason = reason === 'Other' ? otherReason.trim() || 'Other' : reason
    const ok = cancelOrder(order.id, finalReason)
    setCancelOpen(false)
    showToast(ok ? 'Your order has been cancelled' : 'Too late — the order is already out for delivery', ok ? 'success' : 'warning')
  }

  return (
    <main className="dashboard tracking-page">
      <Link to="/orders" className="back-link">← Order history</Link>

      <section className={`track-hero panel status-${status.replace(/\s+/g, '-').toLowerCase()}`}>
        <div className="track-hero-top">
          <div>
            <span className="track-label">Order {order.id}</span>
            {isActive && (
              <>
                <h1>Arriving in {minutesLeft} min</h1>
                <p>Estimated delivery by {formatTime(deliverAt)}</p>
              </>
            )}
            {status === STATUS.DELIVERED && (
              <>
                <h1>Delivered</h1>
                <p>
                  Delivered at {formatTime(deliverAt)} · took {Math.round((deliverAt - placedAt) / 60000)} min
                </p>
              </>
            )}
            {status === STATUS.CANCELLED && (
              <>
                <h1>Order cancelled</h1>
                <p>
                  Cancelled at {formatTime(new Date(order.cancelledAt).getTime())}.{' '}
                  {!order.refund
                    ? 'No payment was taken.'
                    : order.paymentInfo.method === METHODS.WALLET
                      ? `${formatINR(order.refund.amount)} has been refunded to your FoodHub Wallet.`
                      : `A refund of ${formatINR(order.refund.amount)} has been initiated to ${order.refund.to.replace(' (Paid)', '')} and will arrive in 5–7 working days.`}
                </p>
              </>
            )}
          </div>
          <StatusBadge status={status} />
        </div>

        {isActive && (
          <div
            className="track-progress"
            role="progressbar"
            aria-label="Delivery progress"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        )}
      </section>

      <div className="details-grid">
        <section className="panel" aria-labelledby="timeline-title">
          <h2 id="timeline-title">Order timeline</h2>
          <TrackingTimeline order={order} status={status} />

          {status === STATUS.OUT && (
            <div className="rider-card">
              <span className="rider-avatar" aria-hidden="true">🧑‍✈️</span>
              <div>
                <strong>{rider.name}</strong>
                <span>
                  {rider.vehicle} · ★ {rider.rating}
                </span>
              </div>
              <span className="rider-tag">Your delivery partner</span>
            </div>
          )}

          <div className="track-actions">
            {canCancel && (
              <button type="button" className="btn-secondary danger" onClick={() => setCancelOpen(true)}>
                Cancel order
              </button>
            )}
            {!isActive && (
              <button type="button" className="btn-primary btn-inline" onClick={() => reorder(order)}>
                🔁 Reorder
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={() => setInvoiceOpen(true)}>
              🧾 Download invoice
            </button>
          </div>

          {next && (
            <div className="demo-controls">
              <span className="demo-badge">DEMO</span>
              <span>Statuses update automatically over time.</span>
              <button type="button" className="btn-demo" onClick={() => advanceOrder(order.id)}>
                Skip to “{next}”
              </button>
            </div>
          )}
        </section>

        <div className="track-side">
          <section className="panel">
            <h2>Order details</h2>
            <dl className="details-list">
              <div>
                <dt>🧾 Order ID</dt>
                <dd className="mono">{order.id}</dd>
              </div>
              <div>
                <dt>🕒 Placed on</dt>
                <dd>{new Date(order.placedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
              </div>
              <div>
                <dt>📍 Delivery address ({order.address.type})</dt>
                <dd>
                  {order.address.fullName} · {order.address.phone}
                  <br />
                  <span className="muted">{formatAddress(order.address)}</span>
                </dd>
              </div>
              <div>
                <dt>💳 Payment</dt>
                <dd>{order.payment}</dd>
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

      <Modal open={cancelOpen} title="Cancel this order?" onClose={() => setCancelOpen(false)} size="sm">
        <form onSubmit={handleCancel}>
          <fieldset className="reason-list">
            <legend>Why are you cancelling?</legend>
            {CANCEL_REASONS.map((r) => (
              <label key={r} className={`choice ${reason === r ? 'selected' : ''}`}>
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
                {r}
              </label>
            ))}
          </fieldset>
          {reason === 'Other' && (
            <div className="field">
              <div className="input-wrap">
                <textarea
                  rows={2}
                  maxLength={120}
                  aria-label="Tell us more"
                  placeholder="Tell us more (optional)"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setCancelOpen(false)}>
              Keep order
            </button>
            <button type="submit" className="btn-danger">
              Cancel order
            </button>
          </div>
        </form>
      </Modal>

      <InvoiceModal order={invoiceOpen ? order : null} customer={user} onClose={() => setInvoiceOpen(false)} />
      {toastEl}
    </main>
  )
}
