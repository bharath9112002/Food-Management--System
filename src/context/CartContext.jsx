import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { evaluateCoupon } from '../utils/coupons'
import { getStatus, STATUS } from '../utils/orders'
import { computeSummary, MAX_QTY, priceLines } from '../utils/pricing'
import { readJSON, writeJSON } from '../utils/storage'
import { cartKey, couponKey } from '../utils/storageKeys'
import { useAuth } from './AuthContext'
import { useMenu } from './MenuContext'
import { useOrders } from './OrdersContext'

// Re-exported for existing imports; the values live in utils/pricing.
// eslint-disable-next-line react-refresh/only-export-components
export { DELIVERY_FEE, FREE_DELIVERY_FROM, GST_RATE, MAX_QTY } from '../utils/pricing'

const CartContext = createContext(null)

// Each logged-in user gets their own cart (pricing rules live in utils/pricing).
export function CartProvider({ children }) {
  const { user } = useAuth()
  const { items: menu } = useMenu()
  const { orders } = useOrders()
  const key = cartKey(user.id)
  const [lines, setLines] = useState(() => readJSON(key, []))
  const [couponCode, setCouponCode] = useState(() => readJSON(couponKey(user.id), null))

  useEffect(() => {
    writeJSON(key, lines)
  }, [key, lines])

  useEffect(() => {
    writeJSON(couponKey(user.id), couponCode)
  }, [user.id, couponCode])

  const isFirstOrder = !orders.some((o) => getStatus(o) !== STATUS.CANCELLED)

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

  // Drops just the ordered lines; unavailable ones stay for the user to deal with.
  function removeItems(ids) {
    const remove = new Set(ids)
    setLines((current) => current.filter((l) => !remove.has(l.id)))
  }

  const clearCart = () => {
    setLines([])
    setCouponCode(null)
  }

  // Validates against the current cart; an invalid code is not kept.
  function applyCoupon(code) {
    const result = evaluateCoupon(code, {
      subtotal: cart.summary.subtotal,
      baseDeliveryFee: cart.summary.baseDeliveryFee,
      isFirstOrder,
    })
    if (result.valid) setCouponCode(result.coupon.code)
    return result
  }

  const removeCoupon = () => setCouponCode(null)

  // Join with the live menu so price edits and availability changes apply immediately.
  const cart = useMemo(() => {
    const entries = priceLines(lines, menu)
    const { coupon, itemCount, summary } = computeSummary(entries, { couponCode, isFirstOrder })
    return {
      entries,
      itemCount,
      totalQty: entries.reduce((sum, e) => sum + e.qty, 0),
      hasUnavailable: entries.some((e) => !e.orderable),
      coupon,
      summary,
    }
  }, [lines, menu, couponCode, isFirstOrder])

  const getQuantity = (id) => lines.find((l) => l.id === id)?.qty ?? 0

  return (
    <CartContext.Provider
      value={{
        ...cart,
        isFirstOrder,
        addToCart,
        setQuantity,
        removeFromCart,
        removeItems,
        clearCart,
        getQuantity,
        applyCoupon,
        removeCoupon,
      }}
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
