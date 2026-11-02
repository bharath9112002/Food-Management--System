import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatAddress } from '../components/checkout/address'
import { BillDetails, OrderItemList } from '../components/checkout/OrderItems'
import { StateMessage } from '../components/restaurants/StateMessage'
import { useOrders } from '../context/OrdersContext'

const STEPS = ['Order placed', 'Preparing', 'On the way', 'Delivered']

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export default function OrderConfirmation() {
  const { id } = useParams()
  const { getOrder } = useOrders()
  const order = getOrder(id)
  const [copied, setCopied] = useState(false)

  if (!order) {
    return (
      <main className="dashboard">
        <StateMessage
          icon="🔎"
          title="Order not found"
          message="We couldn't find this order on your account."
          action={
            <Link to="/menu" className="btn-primary btn-inline btn-link">
              Browse menu
            </Link>
          }
        />
      </main>
    )
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(order.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked; the ID is still visible to copy by hand.
    }
  }

  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0)
  const etaStart = new Date(new Date(order.placedAt).getTime() + order.eta.min * 60000).toISOString()

  return (
    <main className="dashboard confirmation-page">
      <section className="confirm-hero">
        <div className="confirm-check" aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" />
            <path d="M15 27l7 7 15-15" />
          </svg>
        </div>
        <h1>Order placed successfully!</h1>
        <p>Thank you, {order.address.fullName.split(' ')[0]}. Your food is being prepared.</p>

        <div className="order-id-box">
          <span>Order ID</span>
          <strong>{order.id}</strong>
          <button type="button" className="link-btn" onClick={copyId}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </section>

      <section className="eta-hero panel" aria-label="Estimated delivery">
        <div>
          <span className="eta-label">Estimated delivery</span>
          <strong className="eta-time">
            {formatTime(etaStart)} – {formatTime(order.estimatedDeliveryAt)}
          </strong>
          <span className="eta-sub">
            Arriving in about {order.eta.min}–{order.eta.max} minutes
          </span>
        </div>
        <span className="eta-emoji" aria-hidden="true">🛵</span>
      </section>

      <ol className="order-progress" aria-label="Order status">
        {STEPS.map((step, i) => (
          <li key={step} className={i === 0 ? 'done' : ''} aria-current={i === 0 ? 'step' : undefined}>
            <span className="progress-dot" aria-hidden="true">{i === 0 ? '✓' : i + 1}</span>
            {step}
          </li>
        ))}
      </ol>

      <div className="details-grid">
        <section className="panel">
          <h2>Items ({itemCount})</h2>
          <OrderItemList items={order.items} />
          <BillDetails summary={order.summary} itemCount={itemCount} />
        </section>

        <section className="panel">
          <h2>Delivery details</h2>
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
              <dd>{order.payment}</dd>
            </div>
            <div>
              <dt>🕒 Placed at</dt>
              <dd>
                {new Date(order.placedAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
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
      </div>

      <div className="confirm-actions">
        <Link to="/menu" className="btn-primary btn-inline btn-link">
          Order more food
        </Link>
        <Link to="/" className="btn-secondary">
          Go to dashboard
        </Link>
      </div>
    </main>
  )
}
