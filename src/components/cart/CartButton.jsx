import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

export default function CartButton() {
  const { totalQty } = useCart()

  return (
    <Link to="/cart" className="cart-button" aria-label={`Cart, ${totalQty} ${totalQty === 1 ? 'item' : 'items'}`}>
      <span aria-hidden="true">🛒</span>
      {totalQty > 0 && (
        // Keyed by count so the bump animation replays on every change.
        <span key={totalQty} className="cart-badge" aria-hidden="true">
          {totalQty > 99 ? '99+' : totalQty}
        </span>
      )}
    </Link>
  )
}
