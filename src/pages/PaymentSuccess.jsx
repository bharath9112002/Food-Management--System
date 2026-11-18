import { Link, useParams } from 'react-router-dom'
import { BillDetails } from '../components/checkout/OrderItems'
import { StateMessage } from '../components/restaurants/StateMessage'
import { useOrders } from '../context/OrdersContext'
import { formatINR } from '../data/dashboardData'

export default function PaymentSuccess() {
  const { id } = useParams()
  const { getOrder } = useOrders()
  const order = getOrder(id)
  const info = order?.paymentInfo

  if (!order || info?.status !== 'Paid') {
    return (
      <main className="dashboard">
        <StateMessage
          icon="🔎"
          title="Payment not found"
          message="We couldn't find a completed payment for this order."
          action={
            <Link to="/orders" className="btn-primary btn-inline btn-link">
              View my orders
            </Link>
          }
        />
      </main>
    )
  }

  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <main className="dashboard payment-result success">
      <section className="result-card panel">
        <div className="result-icon" aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" />
            <path d="M15 27l7 7 15-15" />
          </svg>
        </div>
        <h1>Payment successful</h1>
        <p className="result-amount">{formatINR(info.amount)}</p>
        <p className="result-sub">Your order has been placed and the restaurant is preparing it.</p>

        <dl className="receipt">
          <div>
            <dt>Order ID</dt>
            <dd className="mono">{order.id}</dd>
          </div>
          <div>
            <dt>Transaction ID</dt>
            <dd className="mono">{info.txnId}</dd>
          </div>
          <div>
            <dt>Paid via</dt>
            <dd>{order.payment.replace(' (Paid)', '')}</dd>
          </div>
          <div>
            <dt>Date &amp; time</dt>
            <dd>{new Date(info.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
          </div>
          <div>
            <dt>Estimated delivery</dt>
            <dd>
              {order.eta.min}–{order.eta.max} min
            </dd>
          </div>
        </dl>

        <div className="receipt-bill">
          <BillDetails summary={order.summary} itemCount={itemCount} />
        </div>

        <div className="confirm-actions">
          <Link to={`/orders/${order.id}`} className="btn-primary btn-inline btn-link">
            📍 Track order
          </Link>
          <Link to={`/orders/${order.id}/confirmation`} className="btn-secondary">
            View order details
          </Link>
        </div>
      </section>
    </main>
  )
}
