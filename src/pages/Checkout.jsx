import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ADDRESS_TYPES, EMPTY_ADDRESS, formatAddress } from '../components/checkout/address'
import AddressForm from '../components/checkout/AddressForm'
import { BillDetails, OrderItemList } from '../components/checkout/OrderItems'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useMenu } from '../context/MenuContext'
import { useOrders } from '../context/OrdersContext'
import { formatINR } from '../data/dashboardData'
import { estimateDelivery } from '../utils/orders'
import { validateAddress } from '../utils/validation'

const PAYMENT_METHODS = [
  { value: 'Cash on Delivery', icon: '💵', note: 'Pay when your food arrives' },
  { value: 'UPI on Delivery', icon: '📱', note: 'Scan & pay at your door' },
  { value: 'Card on Delivery', icon: '💳', note: 'Card machine with the rider' },
]

const NEW_ADDRESS = 'new'

export default function Checkout() {
  const { user } = useAuth()
  const { loading } = useMenu()
  const { entries, itemCount, summary, removeItems } = useCart()
  const { addresses, saveAddress, deleteAddress, placeOrder } = useOrders()
  const navigate = useNavigate()

  const [selectedId, setSelectedId] = useState(() => addresses[0]?.id ?? NEW_ADDRESS)
  const [form, setForm] = useState(() => ({ ...EMPTY_ADDRESS, fullName: user.name, phone: user.phone ?? '' }))
  const [touched, setTouched] = useState({})
  const [saveForLater, setSaveForLater] = useState(true)
  const [payment, setPayment] = useState(PAYMENT_METHODS[0].value)
  const [instructions, setInstructions] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const [placed, setPlaced] = useState(false)

  const orderable = entries.filter((e) => e.orderable)
  const skipped = entries.length - orderable.length
  const usingNew = selectedId === NEW_ADDRESS || !addresses.some((a) => a.id === selectedId)
  const formErrors = validateAddress(form)

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
      const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))
      address = saveForLater ? saveAddress(clean) : clean
    } else {
      address = addresses.find((a) => a.id === selectedId)
    }

    setPlacing(true)
    // Stand-in for the network round trip a real order API would take.
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const order = placeOrder({ entries: orderable, summary, address, payment, instructions })
    setPlaced(true)
    removeItems(orderable.map((e) => e.id))
    navigate(`/orders/${order.id}/confirmation`, { replace: true })
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
              <span className="step-num">2</span> Payment method
            </h2>
            <div className="payment-options" role="radiogroup" aria-label="Payment method">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.value} className={`address-card ${payment === m.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === m.value}
                    onChange={() => setPayment(m.value)}
                  />
                  <span className="payment-icon" aria-hidden="true">{m.icon}</span>
                  <span className="address-card-body">
                    <strong>{m.value}</strong>
                    <span>{m.note}</span>
                  </span>
                </label>
              ))}
            </div>
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
                <span className="spinner" aria-hidden="true" /> Placing order…
              </>
            ) : (
              <>Place order · {formatINR(summary.total)}</>
            )}
          </button>
          <p className="summary-note">By placing the order you agree to our terms of service.</p>
        </aside>
      </div>
    </main>
  )
}
