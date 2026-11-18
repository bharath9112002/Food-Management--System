import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { COUPONS, describeSavings, evaluateCoupon } from '../../utils/coupons'

export default function CouponBox() {
  const { coupon, summary, isFirstOrder, applyCoupon, removeCoupon } = useCart()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [showOffers, setShowOffers] = useState(false)

  function apply(value) {
    const result = applyCoupon(value)
    if (result.valid) {
      setCode('')
      setError('')
      setShowOffers(false)
    } else {
      setError(result.reason)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim()) return setError('Enter a coupon code')
    apply(code)
  }

  // An applied coupon is re-validated as the cart changes.
  if (coupon) {
    return (
      <div className={`coupon-applied${coupon.valid ? '' : ' invalid'}`}>
        <span className="coupon-icon" aria-hidden="true">🏷️</span>
        <div>
          <strong>{coupon.coupon?.code}</strong>
          <span>{coupon.valid ? describeSavings(coupon) : coupon.reason}</span>
        </div>
        <button type="button" className="link-btn" onClick={removeCoupon}>
          Remove
        </button>
      </div>
    )
  }

  const context = {
    subtotal: summary.subtotal,
    baseDeliveryFee: summary.baseDeliveryFee,
    isFirstOrder,
  }

  return (
    <div className="coupon-box">
      <form className="coupon-form" onSubmit={handleSubmit} noValidate>
        <span aria-hidden="true">🏷️</span>
        <input
          type="text"
          placeholder="Enter coupon code"
          aria-label="Coupon code"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'coupon-error' : undefined}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError('')
          }}
        />
        <button type="submit">Apply</button>
      </form>
      {error && (
        <p id="coupon-error" className="field-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="link-btn offers-toggle"
        aria-expanded={showOffers}
        onClick={() => setShowOffers((v) => !v)}
      >
        {showOffers ? 'Hide offers' : `View ${COUPONS.length} available offers`}
      </button>

      {showOffers && (
        <ul className="offer-list">
          {COUPONS.map((c) => {
            const result = evaluateCoupon(c.code, context)
            return (
              <li key={c.code} className={result.valid ? '' : 'unavailable'}>
                <div>
                  <span className="offer-code">{c.code}</span>
                  <strong>{c.title}</strong>
                  <span>{c.detail}</span>
                  {!result.valid && <span className="offer-reason">{result.reason}</span>}
                </div>
                <button
                  type="button"
                  className="btn-demo"
                  onClick={() => apply(c.code)}
                  disabled={!result.valid}
                >
                  Apply
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
