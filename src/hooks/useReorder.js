import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useMenu } from '../context/MenuContext'

// Puts a past order's dishes back in the cart (at today's prices) and opens the cart.
// Dishes that were removed or are unavailable are skipped, and the cart says how many.
export function useReorder(onNothingAvailable) {
  const { items: menu } = useMenu()
  const { addToCart } = useCart()
  const navigate = useNavigate()

  return function reorder(order) {
    const menuById = new Map(menu.map((m) => [m.id, m]))
    const orderable = order.items.filter((i) => menuById.get(i.id)?.available)
    if (orderable.length === 0) {
      onNothingAvailable?.()
      return
    }
    orderable.forEach((i) => addToCart(menuById.get(i.id), i.qty))
    const skipped = order.items.length - orderable.length
    navigate('/cart', {
      state: skipped
        ? { notice: `${skipped} ${skipped === 1 ? 'item is' : 'items are'} no longer available and ${skipped === 1 ? 'was' : 'were'} skipped.` }
        : undefined,
    })
  }
}
