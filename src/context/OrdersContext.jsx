import { createContext, useContext, useEffect, useState } from 'react'
import { advanceSchedule, buildOrder, CANCELLABLE, cancellation, getStatus } from '../utils/orders'
import { WALLET_START_BALANCE } from '../utils/payment'
import { readJSON, writeJSON } from '../utils/storage'
import { addressesKey, ordersKey, walletKey } from '../utils/storageKeys'
import { useAuth } from './AuthContext'

const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState(() => readJSON(ordersKey(user.id), []))
  const [addresses, setAddresses] = useState(() => readJSON(addressesKey(user.id), []))
  // Demo wallet: every account starts with a balance and can top up freely.
  const [walletBalance, setWalletBalance] = useState(() => readJSON(walletKey(user.id), WALLET_START_BALANCE))

  useEffect(() => {
    writeJSON(ordersKey(user.id), orders)
  }, [user.id, orders])

  useEffect(() => {
    writeJSON(addressesKey(user.id), addresses)
  }, [user.id, addresses])

  useEffect(() => {
    writeJSON(walletKey(user.id), walletBalance)
  }, [user.id, walletBalance])

  // The admin can update this customer's orders/wallet from another tab.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === ordersKey(user.id)) setOrders(readJSON(ordersKey(user.id), []))
      if (e.key === walletKey(user.id)) setWalletBalance(readJSON(walletKey(user.id), WALLET_START_BALANCE))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [user.id])

  const topUpWallet = (amount) => setWalletBalance((b) => b + amount)
  const debitWallet = (amount) => setWalletBalance((b) => b - amount)

  // The first address is the default. New ones go first; edits keep their place.
  function saveAddress(address) {
    const saved = { ...address, id: address.id ?? crypto.randomUUID() }
    setAddresses((current) =>
      current.some((a) => a.id === saved.id)
        ? current.map((a) => (a.id === saved.id ? saved : a))
        : [saved, ...current],
    )
    return saved
  }

  function setDefaultAddress(id) {
    setAddresses((current) => [...current.filter((a) => a.id === id), ...current.filter((a) => a.id !== id)])
  }

  function deleteAddress(id) {
    setAddresses((current) => current.filter((a) => a.id !== id))
  }

  function placeOrder(details) {
    const order = buildOrder({ ...details, existing: orders, userId: user.id })
    setOrders((current) => [order, ...current])
    return order
  }

  const getOrder = (id) => orders.find((o) => o.id === id)

  const updateOrder = (id, change) =>
    setOrders((current) => current.map((o) => (o.id === id ? { ...o, ...change(o) } : o)))

  // Returns false if the order already left the kitchen by the time the user confirmed.
  function cancelOrder(id, reason) {
    const order = getOrder(id)
    if (!order || !CANCELLABLE.includes(getStatus(order))) return false
    const { change, walletRefund } = cancellation(order, reason)
    if (walletRefund) topUpWallet(walletRefund)
    updateOrder(id, () => change)
    return true
  }

  function advanceOrder(id) {
    updateOrder(id, (o) => ({ schedule: advanceSchedule(o) }))
  }

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addresses,
        saveAddress,
        deleteAddress,
        setDefaultAddress,
        placeOrder,
        getOrder,
        cancelOrder,
        advanceOrder,
        walletBalance,
        topUpWallet,
        debitWallet,
      }}
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
