import { useEffect, useMemo, useState } from 'react'
import { getAllOrders, getCustomerCart, getCustomers, subscribe } from '../utils/adminData'
import { useNow } from './useNow'

// Live view of all customers, their orders and carts for admin pages. Re-reads when
// data changes (this tab or another) and re-derives statuses on a clock tick.
export function useAdminData(tickMs = 5000) {
  const [version, setVersion] = useState(0)
  const now = useNow(tickMs)

  useEffect(() => subscribe(() => setVersion((v) => v + 1)), [])

  const data = useMemo(() => {
    const customers = getCustomers()
    return {
      customers,
      orders: getAllOrders(customers),
      carts: customers.map((customer) => ({ customer, lines: getCustomerCart(customer.id) })),
    }
    // `version` is the cache key: bumped whenever storage changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  return { ...data, now }
}
