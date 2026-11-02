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

export function BillDetails({ summary, itemCount }) {
  const freeDelivery = summary.deliveryFee === 0 && summary.subtotal > 0
  return (
    <dl className="summary-rows">
      <div>
        <dt>Item total{itemCount ? ` (${itemCount})` : ''}</dt>
        <dd>{formatINR(summary.subtotal)}</dd>
      </div>
      <div>
        <dt>Delivery fee</dt>
        <dd className={freeDelivery ? 'free' : ''}>{freeDelivery ? 'FREE' : formatINR(summary.deliveryFee)}</dd>
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
  )
}
