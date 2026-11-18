import { formatINR } from '../../data/dashboardData'
import { VegMark } from '../menu/FoodCard'
import { GST_RATE } from '../../context/CartContext'

// Compact item list + bill breakdown, shared by checkout and confirmation.
export function OrderItemList({ items }) {
  return (
    <ul className="order-items">
      {items.map((i) => (
        <li key={i.id}>
          <VegMark isVeg={i.isVeg} />
          <span className="order-item-name">
            {i.name} <span className="order-item-qty">× {i.qty}</span>
          </span>
          <span className="order-item-total">{formatINR(i.lineTotal)}</span>
        </li>
      ))}
    </ul>
  )
}

// Older orders were saved before coupons existed, so discount fields may be missing.
export function BillDetails({ summary, itemCount }) {
  const freeDelivery = summary.deliveryFee === 0 && summary.subtotal > 0
  const waivedFee = (summary.baseDeliveryFee ?? 0) > summary.deliveryFee
  return (
    <>
    <dl className="summary-rows">
      <div>
        <dt>Item total{itemCount ? ` (${itemCount})` : ''}</dt>
        <dd>{formatINR(summary.subtotal)}</dd>
      </div>
      {summary.discount > 0 && (
        <div className="discount-row">
          <dt>Coupon discount ({summary.couponCode})</dt>
          <dd>−{formatINR(summary.discount)}</dd>
        </div>
      )}
      <div>
        <dt>Delivery fee</dt>
        <dd className={freeDelivery ? 'free' : ''}>
          {waivedFee && <s className="struck">{formatINR(summary.baseDeliveryFee)}</s>}
          {freeDelivery ? 'FREE' : formatINR(summary.deliveryFee)}
        </dd>
      </div>
      <div>
        <dt>GST ({GST_RATE * 100}%)</dt>
        <dd>{formatINR(summary.gst)}</dd>
      </div>
      <div className="summary-total">
        <dt>To pay</dt>
        <dd>{formatINR(summary.total)}</dd>
      </div>
    </dl>
    {summary.savings > 0 && (
      <p className="savings-note">🎉 You&apos;re saving {formatINR(summary.savings)} on this order</p>
    )}
    </>
  )
}
