import { useCart } from '../../context/CartContext'
import QuantityStepper from './QuantityStepper'

// "Add" until the item is in the cart, then a quantity stepper.
export default function AddToCartButton({ item, size = 'md' }) {
  const { addToCart, setQuantity, getQuantity } = useCart()
  const qty = getQuantity(item.id)

  if (!item.available) {
    return (
      <button type="button" className={`btn-add btn-add-${size}`} disabled>
        Unavailable
      </button>
    )
  }

  if (qty > 0) {
    return (
      <QuantityStepper
        qty={qty}
        name={item.name}
        size={size}
        onChange={(next) => setQuantity(item.id, next)}
      />
    )
  }

  return (
    <button type="button" className={`btn-add btn-add-${size}`} onClick={() => addToCart(item)}>
      🛒 Add to cart
    </button>
  )
}
