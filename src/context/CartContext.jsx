import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { readJSON, writeJSON } from '../utils/storage'
import { useAuth } from './AuthContext'
import { useMenu } from './MenuContext'

export const MAX_QTY = 10
export const DELIVERY_FEE = 40
export const FREE_DELIVERY_FROM = 499
export const GST_RATE = 0.05

const CartContext = createContext(null)
const cartKey = (userId) => `food_cart_${userId}`

// Each logged-in user gets their own cart. Lines keep a snapshot of the item so a
// dish deleted from the menu still shows up (flagged) instead of vanishing silently.
export function CartProvider({ children }) {
  const { user } = useAuth()
  const { items: menu } = useMenu()
  const key = cartKey(user.id)
  const [lines, setLines] = useState(() => readJSON(key, []))

  useEffect(() => {
    writeJSON(key, lines)
  }, [key, lines])

  // Keep carts in sync when the same account is open in another tab.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === key) setLines(readJSON(key, []))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  function addToCart(item, qty = 1) {
    setLines((current) => {
      const existing = current.find((l) => l.id === item.id)
      if (existing) {
        return current.map((l) =>
          l.id === item.id ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l,
        )
      }
      const snapshot = { name: item.name, price: item.price, image: item.image, isVeg: item.isVeg }
      return [...current, { id: item.id, qty: Math.min(MAX_QTY, qty), snapshot, addedAt: Date.now() }]
    })
  }

  function setQuantity(id, qty) {
    if (qty <= 0) return removeFromCart(id)
    setLines((current) => current.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)))
  }

  function removeFromCart(id) {
    setLines((current) => current.filter((l) => l.id !== id))
  }

  const clearCart = () => setLines([])

  // Join with the live menu so price edits and availability changes apply immediately.
  const cart = useMemo(() => {
    const menuById = new Map(menu.map((i) => [i.id, i]))
    const entries = lines.map((line) => {
      const item = menuById.get(line.id)
      const details = item ?? { ...line.snapshot, id: line.id }
      const orderable = Boolean(item?.available)
      return { ...line, item: details, removed: !item, orderable, lineTotal: details.price * line.qty }
    })

    const billable = entries.filter((e) => e.orderable)
    const itemCount = billable.reduce((sum, e) => sum + e.qty, 0)
    const subtotal = billable.reduce((sum, e) => sum + e.lineTotal, 0)
    const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE
    const gst = Math.round(subtotal * GST_RATE)

    return {
      entries,
      itemCount,
      totalQty: entries.reduce((sum, e) => sum + e.qty, 0),
      hasUnavailable: entries.some((e) => !e.orderable),
      summary: { subtotal, deliveryFee, gst, total: subtotal + deliveryFee + gst },
    }
  }, [lines, menu])

  const getQuantity = (id) => lines.find((l) => l.id === id)?.qty ?? 0

  return (
    <CartContext.Provider
      value={{ ...cart, addToCart, setQuantity, removeFromCart, clearCart, getQuantity }}
    >
      {children}
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
