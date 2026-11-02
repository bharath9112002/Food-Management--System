import { createContext, useContext, useEffect, useState } from 'react'
import { estimateDelivery, generateOrderId } from '../utils/orders'
import { readJSON, writeJSON } from '../utils/storage'
import { useAuth } from './AuthContext'

const OrdersContext = createContext(null)
const ordersKey = (userId) => `food_orders_${userId}`
const addressesKey = (userId) => `food_addresses_${userId}`

export function OrdersProvider({ children }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState(() => readJSON(ordersKey(user.id), []))
  const [addresses, setAddresses] = useState(() => readJSON(addressesKey(user.id), []))

  useEffect(() => {
    writeJSON(ordersKey(user.id), orders)
  }, [user.id, orders])

  useEffect(() => {
    writeJSON(addressesKey(user.id), addresses)
  }, [user.id, addresses])

  function saveAddress(address) {
    const saved = { ...address, id: address.id ?? crypto.randomUUID() }
    setAddresses((current) => [saved, ...current.filter((a) => a.id !== saved.id)])
    return saved
  }

  function deleteAddress(id) {
    setAddresses((current) => current.filter((a) => a.id !== id))
  }

  function placeOrder({ entries, summary, address, payment, instructions }) {
    const placedAt = new Date()
    const eta = estimateDelivery(entries)
    const order = {
      id: generateOrderId(orders),
      userId: user.id,
      status: 'Placed',
      placedAt: placedAt.toISOString(),
      eta,
      estimatedDeliveryAt: new Date(placedAt.getTime() + eta.max * 60000).toISOString(),
      items: entries.map(({ item, qty, lineTotal }) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        isVeg: item.isVeg,
        // Uploaded images are large data URLs; keep order history light.
        image: item.image?.startsWith('data:') ? '' : item.image,
        qty,
        lineTotal,
      })),
      summary,
      address,
      payment,
      instructions: instructions.trim(),
    }
    setOrders((current) => [order, ...current])
    return order
  }

  const getOrder = (id) => orders.find((o) => o.id === id)

  return (
    <OrdersContext.Provider
      value={{ orders, addresses, saveAddress, deleteAddress, placeOrder, getOrder }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used inside <OrdersProvider>')
  return ctx
}
