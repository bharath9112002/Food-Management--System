import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { formatINR } from '../data/dashboardData'
import { METHODS } from '../utils/payment'

const HELP = {
  CARD_DECLINED: 'Check your card details, make sure online payments are enabled, or try another card.',
  UPI_TIMEOUT: 'Approve the request in your UPI app within the time limit, or try another UPI ID.',
}

export default function PaymentFailed() {
  const { state } = useLocation()
  const navigate = useNavigate()

  // Only reachable from a failed checkout attempt.
  if (!state?.reason) return <Navigate to="/cart" replace />

  const retry = (method) => navigate('/checkout', { replace: true, state: method ? { method } : undefined })

  return (
    <main className="dashboard payment-result failed">
      <section className="result-card panel">
        <div className="result-icon" aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" />
            <path d="M18 18l16 16M34 18L18 34" />
          </svg>
        </div>
        <h1>Payment failed</h1>
        <p className="result-amount">{formatINR(state.amount)}</p>
        <p className="result-sub">{state.reason}</p>

        <dl className="receipt">
          <div>
            <dt>Payment method</dt>
            <dd>{state.methodLabel}</dd>
          </div>
          <div>
            <dt>Error code</dt>
            <dd className="mono">{state.code}</dd>
          </div>
          <div>
            <dt>Order status</dt>
            <dd>Not placed — your cart is saved</dd>
          </div>
        </dl>

        <p className="alert warning">
          {HELP[state.code] ?? 'Please try again or choose a different payment method.'} No money was deducted; if any
          amount was debited, it will be refunded within 5–7 working days.
        </p>

        <div className="confirm-actions">
          <button type="button" className="btn-primary btn-inline" onClick={() => retry()}>
            🔁 Retry payment
          </button>
          <button type="button" className="btn-secondary" onClick={() => retry(METHODS.COD)}>
            💵 Pay cash on delivery
          </button>
          <Link to="/cart" className="btn-secondary">
            Back to cart
          </Link>
        </div>
      </section>
    </main>
  )
}
