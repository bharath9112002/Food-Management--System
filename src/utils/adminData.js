// Admin access to every customer's data. Each customer's cart/orders/wallet live under
// their own localStorage keys; these helpers read and write them directly.

import { buildOrder, cancellation, getStatus, moveToStatus } from './orders'
import { WALLET_START_BALANCE } from './payment'
import { getUsers, readJSON, ROLES, writeJSON } from './storage'
import { addressesKey, cartKey, ordersKey, walletKey } from './storageKeys'

// Tells open admin pages in this tab to re-read (other tabs get the native storage event).
const CHANGE_EVENT = 'foodhub:admin-data'
const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT))

export function subscribe(callback) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function getCustomers() {
  return getUsers()
    .filter((u) => u.role === ROLES.CUSTOMER)
    .map(({ passwordHash: _passwordHash, ...u }) => u)
}

export const getCustomerOrders = (userId) => readJSON(ordersKey(userId), [])
export const getCustomerAddresses = (userId) => readJSON(addressesKey(userId), [])
export const getCustomerCart = (userId) => readJSON(cartKey(userId), [])

// Every order from every customer, newest first, each tagged with its customer.
export function getAllOrders(customers = getCustomers()) {
  return customers
    .flatMap((customer) => getCustomerOrders(customer.id).map((order) => ({ ...order, customer })))
    .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
}

export function findOrder(orderId) {
  return getAllOrders().find((o) => o.id === orderId) ?? null
}

function updateCustomerOrder(userId, orderId, change) {
  const orders = getCustomerOrders(userId)
  writeJSON(
    ordersKey(userId),
    orders.map((o) => (o.id === orderId ? { ...o, ...change(o) } : o)),
  )
  notify()
}

export function setOrderStatus(order, target) {
  updateCustomerOrder(order.userId, order.id, (o) => ({ schedule: moveToStatus(o, target) }))
}

export function cancelOrderAsAdmin(order, reason) {
  const { change, walletRefund } = cancellation(order, reason, 'restaurant')
  if (walletRefund) {
    const balance = readJSON(walletKey(order.userId), WALLET_START_BALANCE)
    writeJSON(walletKey(order.userId), balance + walletRefund)
  }
  updateCustomerOrder(order.userId, order.id, () => change)
}

// Phone/counter order placed by the admin on a customer's behalf.
export function placeOrderForCustomer(customer, details, admin) {
  const existing = getCustomerOrders(customer.id)
  const order = buildOrder({
    ...details,
    existing,
    userId: customer.id,
    placedBy: { id: admin.id, name: admin.name },
  })
  writeJSON(ordersKey(customer.id), [order, ...existing])
  notify()
  return order
}

export function saveCustomerAddress(customerId, address) {
  const saved = { ...address, id: crypto.randomUUID() }
  writeJSON(addressesKey(customerId), [saved, ...getCustomerAddresses(customerId)])
  notify()
  return saved
}

export const isActive = (order, now) => {
  const status = getStatus(order, now)
  return status !== 'Delivered' && status !== 'Cancelled'
}
