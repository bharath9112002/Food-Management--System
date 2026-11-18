import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ADDRESS_TYPES, EMPTY_ADDRESS, formatAddress } from '../components/checkout/address'
import AddressForm from '../components/checkout/AddressForm'
import CouponBox from '../components/cart/CouponBox'
import PaymentSection from '../components/checkout/PaymentSection'
import { BillDetails, OrderItemList } from '../components/checkout/OrderItems'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useMenu } from '../context/MenuContext'
import { useOrders } from '../context/OrdersContext'
import { formatINR } from '../data/dashboardData'
import { estimateDelivery } from '../utils/orders'
import { describeMethod, EMPTY_PAYMENT, METHODS, processPayment, validatePayment } from '../utils/payment'
import { validateAddress } from '../utils/validation'

const NEW_ADDRESS = 'new'

export default function Checkout() {
  const { user } = useAuth()
  const { loading } = useMenu()
  const { entries, itemCount, summary, removeItems, removeCoupon } = useCart()
  const { addresses, saveAddress, deleteAddress, placeOrder, walletBalance, topUpWallet, debitWallet } = useOrders()
  const navigate = useNavigate()
  const location = useLocation()

  const [selectedId, setSelectedId] = useState(() => addresses[0]?.id ?? NEW_ADDRESS)
  const [form, setForm] = useState(() => ({ ...EMPTY_ADDRESS, fullName: user.name, phone: user.phone ?? '' }))
  const [touched, setTouched] = useState({})
  const [saveForLater, setSaveForLater] = useState(true)
  // The failure screen can send the user back with a different method preselected.
  const [payment, setPayment] = useState(() => ({ ...EMPTY_PAYMENT, method: location.state?.method ?? EMPTY_PAYMENT.method }))
  const [payTouched, setPayTouched] = useState({})
  const [instructions, setInstructions] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const [placed, setPlaced] = useState(false)

  const orderable = entries.filter((e) => e.orderable)
  const skipped = entries.length - orderable.length
  const usingNew = selectedId === NEW_ADDRESS || !addresses.some((a) => a.id === selectedId)
  const formErrors = validateAddress(form)
  const paymentErrors = validatePayment(payment, { amount: summary.total, walletBalance })
  const isCod = payment.method === METHODS.COD

  if (loading) {
    return (
      <main className="dashboard" aria-busy="true">
        <div className="skeleton details-hero-skeleton" />
      </main>
    )
  }

  // Prevent empty-cart checkout. Skipped right after placing, while we navigate away.
  if (itemCount === 0 && !placed) {
    return (
      <Navigate
        to="/cart"
        replace
        state={{ notice: 'Add something to your cart before checking out.' }}
      />
    )
  }

  const eta = estimateDelivery(orderable)

  async function handlePlaceOrder() {
    setPlaceError('')
    let address
    if (usingNew) {
      setTouched(Object.fromEntries(Object.keys(EMPTY_ADDRESS).map((k) => [k, true])))
      if (Object.keys(formErrors).length) {
        setPlaceError('Please fix the delivery address details.')
        document.querySelector('.address-form [aria-invalid="true"]')?.focus()
        return
      }
    }

    setPayTouched({ upiId: true, number: true, name: true, expiry: true, cvv: true })
    if (Object.keys(paymentErrors).length) {
      setPlaceError(paymentErrors.wallet ?? 'Please check your payment details.')
      document.querySelector('.payment-panel [aria-invalid="true"]')?.focus()
      return
    }

    if (usingNew) {
      const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))
      address = saveForLater ? saveAddress(clean) : clean
      // Select the saved copy so a retry after a failed payment doesn't save it twice.
      if (saveForLater) setSelectedId(address.id)
    } else {
      address = addresses.find((a) => a.id === selectedId)
    }

    const amount = summary.total
    const methodLabel = describeMethod(payment)
    setPlacing(true)

    let paymentInfo
    if (isCod) {
      // Stand-in for the network round trip a real order API would take.
      await new Promise((resolve) => setTimeout(resolve, 1200))
      paymentInfo = { method: METHODS.COD, status: 'Pay on delivery', amount }
    } else {
      const result = await processPayment({ ...payment, amount })
      if (!result.ok) {
        setPlacing(false)
        navigate('/payment/failed', { state: { reason: result.reason, code: result.code, amount, methodLabel } })
        return
      }
      if (payment.method === METHODS.WALLET) debitWallet(amount)
      paymentInfo = { method: payment.method, status: 'Paid', txnId: result.txnId, paidAt: result.paidAt, amount }
    }

    const order = placeOrder({
      entries: orderable,
      summary,
      address,
      payment: isCod ? methodLabel : `${methodLabel} (Paid)`,
      paymentInfo,
      instructions,
    })
    setPlaced(true)
    removeItems(orderable.map((e) => e.id))
    removeCoupon()
    navigate(isCod ? `/orders/${order.id}/confirmation` : `/payment/success/${order.id}`, { replace: true })
  }

  return (
    <main className="dashboard checkout-page">
      <Link to="/cart" className="back-link">
        ← Back to cart
      </Link>

      <div className="page-head">
        <div>
          <h1>Checkout</h1>
          <p>Confirm your delivery details and place your order.</p>
        </div>
      </div>

      <div className="cart-layout">
        <div className="checkout-steps">
          <section className="panel" aria-labelledby="address-title">
            <h2 id="address-title" className="step-title">
              <span className="step-num">1</span> Delivery address
            </h2>

            {addresses.length > 0 && (
              <div className="address-options" role="radiogroup" aria-label="Saved addresses">
                {addresses.map((a) => {
                  const type = ADDRESS_TYPES.find((t) => t.value === a.type)
                  return (
                    <label key={a.id} className={`address-card ${selectedId === a.id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="address"
                        checked={selectedId === a.id}
                        onChange={() => setSelectedId(a.id)}
                      />
                      <span className="address-card-body">
                        <strong>
                          {type?.icon} {a.type}
                        </strong>
                        <span>
                          {a.fullName} · {a.phone}
                        </span>
                        <span className="address-text">{formatAddress(a)}</span>
                      </span>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Delete ${a.type} address`}
                        title="Delete address"
                        onClick={(e) => {
                          e.preventDefault()
                          deleteAddress(a.id)
                          if (selectedId === a.id) setSelectedId(NEW_ADDRESS)
                        }}
                      >
                        ✕
                      </button>
                    </label>
                  )
                })}

                <label className={`address-card add-new ${usingNew ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="address"
                    checked={usingNew}
                    onChange={() => setSelectedId(NEW_ADDRESS)}
                  />
                  <span className="address-card-body">
                    <strong>+ Add a new address</strong>
                  </span>
                </label>
              </div>
            )}

            {usingNew && (
              <>
                <AddressForm
                  values={form}
                  errors={formErrors}
                  touched={touched}
                  onChange={(name, value) => setForm((f) => ({ ...f, [name]: value }))}
                  onBlur={(name) => setTouched((t) => ({ ...t, [name]: true }))}
                />
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={saveForLater}
                    onChange={(e) => setSaveForLater(e.target.checked)}
                  />
                  Save this address for future orders
                </label>
              </>
            )}
          </section>

          <section className="panel" aria-labelledby="payment-title">
            <h2 id="payment-title" className="step-title">
              <span className="step-num">2</span> Payment
            </h2>
            <PaymentSection
              payment={payment}
              onChange={(change) => {
                setPayment((p) => ({ ...p, ...change }))
                setPlaceError('')
              }}
              errors={paymentErrors}
              touched={payTouched}
              onBlur={(field) => setPayTouched((t) => ({ ...t, [field]: true }))}
              amount={summary.total}
              walletBalance={walletBalance}
              onTopUp={topUpWallet}
            />
          </section>

          <section className="panel" aria-labelledby="notes-title">
            <h2 id="notes-title" className="step-title">
              <span className="step-num">3</span> Delivery instructions
              <small>(optional)</small>
            </h2>
            <div className="field">
              <div className="input-wrap">
                <textarea
                  rows={2}
                  maxLength={150}
                  aria-labelledby="notes-title"
                  placeholder="e.g. Ring the bell, leave at the door, less spicy…"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
              <div className="field-hint">
                <span />
                <small>{instructions.length}/150</small>
              </div>
            </div>
          </section>
        </div>

        <aside className="panel cart-summary" aria-labelledby="checkout-summary-title">
          <h2 id="checkout-summary-title">Order Summary</h2>

          <OrderItemList items={orderable.map((e) => ({ ...e.item, qty: e.qty, lineTotal: e.lineTotal }))} />

          {skipped > 0 && (
            <p className="alert warning">
              {skipped} unavailable {skipped === 1 ? 'item' : 'items'} will stay in your cart and won&apos;t be ordered.
            </p>
          )}

          <CouponBox />

          <BillDetails summary={summary} itemCount={itemCount} />

          <div className="eta-box">
            <span aria-hidden="true">🛵</span>
            <span>
              Estimated delivery in{' '}
              <strong>
                {eta.min}–{eta.max} min
              </strong>
            </span>
          </div>

          {placeError && (
            <p className="alert error" role="alert">
              {placeError}
            </p>
          )}

          <button type="button" className="btn-primary" onClick={handlePlaceOrder} disabled={placing}>
            {placing ? (
              <>
                <span className="spinner" aria-hidden="true" /> {isCod ? 'Placing order…' : 'Processing…'}
              </>
            ) : isCod ? (
              <>Place order · {formatINR(summary.total)}</>
            ) : (
              <>🔒 Pay {formatINR(summary.total)}</>
            )}
          </button>
          <p className="summary-note">By placing the order you agree to our terms of service.</p>
        </aside>
      </div>

      {placing && !isCod && (
        <div className="processing-overlay" role="alertdialog" aria-modal="true" aria-labelledby="processing-title">
          <div className="processing-card">
            <span className="processing-spinner" aria-hidden="true" />
            <h2 id="processing-title">Processing your payment</h2>
            <p>
              {formatINR(summary.total)} via {describeMethod(payment)}
            </p>
            <small>Please don&apos;t close or refresh this page.</small>
          </div>
        </div>
      )}
    </main>
  )
}
