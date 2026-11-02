import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import QuantityStepper from '../components/cart/QuantityStepper'
import { VegMark } from '../components/menu/FoodCard'
import { FALLBACK_IMAGE, handleImageError } from '../components/menu/image'
import { ConfirmDialog } from '../components/Modal'
import { StateMessage } from '../components/restaurants/StateMessage'
import { FREE_DELIVERY_FROM, GST_RATE, useCart } from '../context/CartContext'
import { useMenu } from '../context/MenuContext'
import { formatINR } from '../data/dashboardData'
import { useToast } from '../hooks/useToast'

export default function Cart() {
  const { loading } = useMenu()
  const { entries, itemCount, hasUnavailable, summary, setQuantity, removeFromCart, clearCart } =
    useCart()
  const [confirmClear, setConfirmClear] = useState(false)
  const [toastEl, showToast] = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  // Shown when checkout bounces an empty cart back here.
  useEffect(() => {
    if (!location.state?.notice) return
    showToast(location.state.notice, 'warning')
    navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate, showToast])

  function handleRemove(entry) {
    removeFromCart(entry.id)
    showToast(`Removed “${entry.item.name}” from cart`)
  }

  function handleClear() {
    clearCart()
    setConfirmClear(false)
    showToast('Cart cleared')
  }

  function removeUnavailable() {
    entries.filter((e) => !e.orderable).forEach((e) => removeFromCart(e.id))
  }

  if (loading) {
    return (
      <main className="dashboard" aria-busy="true">
        <div className="skeleton details-hero-skeleton" />
      </main>
    )
  }

  if (entries.length === 0) {
    return (
      <main className="dashboard">
        <div className="page-head">
          <h1>Your Cart</h1>
        </div>
        <StateMessage
          icon="🛒"
          title="Your cart is empty"
          message="Looks like you haven't added anything yet. Explore the menu and find something delicious!"
          action={
            <Link to="/menu" className="btn-primary btn-inline btn-link">
              Browse menu
            </Link>
          }
        />
        {toastEl}
      </main>
    )
  }

  const toFreeDelivery = FREE_DELIVERY_FROM - summary.subtotal
  const progress = Math.min(100, (summary.subtotal / FREE_DELIVERY_FROM) * 100)

  return (
    <main className="dashboard cart-page">
      <div className="page-head">
        <div>
          <h1>Your Cart</h1>
          <p>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} ready to order
          </p>
        </div>
        <button type="button" className="btn-secondary danger" onClick={() => setConfirmClear(true)}>
          🗑️ Clear cart
        </button>
      </div>

      <div className="cart-layout">
        <section className="panel cart-items" aria-label="Cart items">
          {hasUnavailable && (
            <div className="alert warning cart-alert" role="status">
              <span>Some items are no longer available and won&apos;t be included in your order.</span>
              <button type="button" className="link-btn" onClick={removeUnavailable}>
                Remove them
              </button>
            </div>
          )}

          <ul className="cart-list">
            {entries.map((entry) => {
              const { item } = entry
              return (
                <li key={entry.id} className={`cart-line${entry.orderable ? '' : ' unavailable'}`}>
                  <img src={item.image || FALLBACK_IMAGE} alt="" onError={handleImageError} />

                  <div className="cart-line-info">
                    <div className="cart-line-name">
                      <VegMark isVeg={item.isVeg} />
                      {entry.removed ? (
                        <span>{item.name}</span>
                      ) : (
                        <Link to={`/menu/${entry.id}`}>{item.name}</Link>
                      )}
                    </div>
                    <span className="cart-line-price">{formatINR(item.price)} each</span>
                    {!entry.orderable && (
                      <span className="cart-line-flag">
                        {entry.removed ? 'Removed from menu' : 'Currently unavailable'}
                      </span>
                    )}
                  </div>

                  <div className="cart-line-controls">
                    {entry.orderable ? (
                      <QuantityStepper
                        qty={entry.qty}
                        name={item.name}
                        size="sm"
                        onChange={(qty) => (qty === 0 ? handleRemove(entry) : setQuantity(entry.id, qty))}
                      />
                    ) : (
                      <span className="cart-line-qty">Qty {entry.qty}</span>
                    )}
                    <strong className="cart-line-total">
                      {entry.orderable ? formatINR(entry.lineTotal) : '—'}
                    </strong>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleRemove(entry)}
                      aria-label={`Remove ${item.name} from cart`}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <Link to="/menu" className="add-more">
            + Add more items
          </Link>
        </section>

        <aside className="panel cart-summary" aria-labelledby="summary-title">
          <h2 id="summary-title">Order Summary</h2>

          {summary.subtotal > 0 && (
            <div className="free-delivery">
              <p>
                {toFreeDelivery > 0 ? (
                  <>
                    Add <strong>{formatINR(toFreeDelivery)}</strong> more for free delivery
                  </>
                ) : (
                  <>🎉 You&apos;ve unlocked <strong>free delivery</strong>!</>
                )}
              </p>
              <div className="progress" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <dl className="summary-rows">
            <div>
              <dt>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
              <dd>{formatINR(summary.subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery fee</dt>
              <dd className={summary.deliveryFee === 0 && summary.subtotal > 0 ? 'free' : ''}>
                {summary.deliveryFee === 0 && summary.subtotal > 0 ? 'FREE' : formatINR(summary.deliveryFee)}
              </dd>
            </div>
            <div>
              <dt>GST ({GST_RATE * 100}%)</dt>
              <dd>{formatINR(summary.gst)}</dd>
            </div>
            <div className="summary-total">
              <dt>Total</dt>
              <dd>{formatINR(summary.total)}</dd>
            </div>
          </dl>

          <button
            type="button"
            className="btn-primary"
            disabled={itemCount === 0}
            onClick={() => navigate('/checkout')}
          >
            Proceed to checkout · {formatINR(summary.total)}
          </button>
          <p className="summary-note">Prices include all applicable charges.</p>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear your cart?"
        message={`All ${entries.length} ${entries.length === 1 ? 'item' : 'items'} will be removed from your cart.`}
        confirmLabel="Clear cart"
        onConfirm={handleClear}
        onClose={() => setConfirmClear(false)}
      />

      {toastEl}
    </main>
  )
}
