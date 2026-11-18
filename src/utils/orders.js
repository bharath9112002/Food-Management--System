const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid misreading

// e.g. FH-261102-7KQ4 — date-stamped, with a random suffix checked for uniqueness.
export function generateOrderId(existing) {
  const now = new Date()
  const date = [now.getFullYear() % 100, now.getMonth() + 1, now.getDate()]
    .map((n) => String(n).padStart(2, '0'))
    .join('')
  const taken = new Set(existing.map((o) => o.id))
  let id
  do {
    const random = crypto.getRandomValues(new Uint32Array(4))
    const suffix = Array.from(random, (n) => ID_CHARS[n % ID_CHARS.length]).join('')
    id = `FH-${date}-${suffix}`
  } while (taken.has(id))
  return id
}

// Kitchen time is driven by the slowest dish, plus a little per extra plate, plus the ride.
export function estimateDelivery(entries) {
  const slowest = Math.max(15, ...entries.map((e) => Math.min(e.item.prepTime ?? 20, 35)))
  const plates = entries.reduce((sum, e) => sum + e.qty, 0)
  const min = Math.min(60, Math.round((slowest + 12 + Math.max(0, plates - 1)) / 5) * 5)
  return { min, max: min + 10 }
}

// ---------- Tracking ----------
// Orders progress on a schedule fixed at placement; status is read off the clock,
// so tracking keeps working across refreshes without any background job.

export const STATUS = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  OUT: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export const FLOW = [STATUS.PLACED, STATUS.PREPARING, STATUS.OUT, STATUS.DELIVERED]

export const STATUS_TONE = {
  [STATUS.PLACED]: 'neutral',
  [STATUS.PREPARING]: 'warning',
  [STATUS.OUT]: 'info',
  [STATUS.DELIVERED]: 'good',
  [STATUS.CANCELLED]: 'critical',
}

export const CANCELLABLE = [STATUS.PLACED, STATUS.PREPARING]

const MINUTE = 60000

// Kitchen accepts after ~1 min, the rider leaves ~12 min before arrival,
// and the food lands in the middle of the promised window.
export function buildSchedule(placedAt, eta) {
  const start = new Date(placedAt).getTime()
  const deliveredIn = Math.round((eta.min + eta.max) / 2)
  return {
    [STATUS.PLACED]: new Date(start).toISOString(),
    [STATUS.PREPARING]: new Date(start + MINUTE).toISOString(),
    [STATUS.OUT]: new Date(start + Math.max(2, deliveredIn - 12) * MINUTE).toISOString(),
    [STATUS.DELIVERED]: new Date(start + deliveredIn * MINUTE).toISOString(),
  }
}

// Orders placed before tracking existed have no stored schedule.
export const getSchedule = (order) => order.schedule ?? buildSchedule(order.placedAt, order.eta)

export function getStatus(order, now = Date.now()) {
  if (order.cancelledAt) return STATUS.CANCELLED
  const schedule = getSchedule(order)
  return FLOW.findLast((step) => new Date(schedule[step]).getTime() <= now) ?? STATUS.PLACED
}

export function getNextStatus(order, now = Date.now()) {
  const status = getStatus(order, now)
  const index = FLOW.indexOf(status)
  return index >= 0 && index < FLOW.length - 1 ? FLOW[index + 1] : null
}

// Demo helper: makes the next step happen now and pulls later steps forward by the same amount.
export function advanceSchedule(order, now = Date.now()) {
  const schedule = getSchedule(order)
  const next = getNextStatus(order, now)
  if (!next) return schedule
  const shift = new Date(schedule[next]).getTime() - now
  const nextIndex = FLOW.indexOf(next)
  return Object.fromEntries(
    FLOW.map((step, i) => [
      step,
      i < nextIndex ? schedule[step] : new Date(new Date(schedule[step]).getTime() - shift).toISOString(),
    ]),
  )
}

const RIDERS = [
  { name: 'Ravi Kumar', vehicle: 'Honda Activa', rating: 4.8 },
  { name: 'Suresh Babu', vehicle: 'TVS Jupiter', rating: 4.7 },
  { name: 'Imran Khan', vehicle: 'Hero Splendor', rating: 4.9 },
  { name: 'Deepak Nair', vehicle: 'Bajaj Pulsar', rating: 4.6 },
]

// Stable per order, so the same rider shows on every visit.
export function getRider(orderId) {
  const hash = [...orderId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return RIDERS[hash % RIDERS.length]
}

// ---------- Shared by customer checkout and admin order placement ----------

// `payment` is the display label; `paymentInfo` holds method/status/transaction.
export function buildOrder({ existing, userId, entries, summary, address, payment, paymentInfo, instructions, placedBy }) {
  const placedAt = new Date()
  const eta = estimateDelivery(entries)
  return {
    id: generateOrderId(existing),
    userId,
    placedAt: placedAt.toISOString(),
    eta,
    estimatedDeliveryAt: new Date(placedAt.getTime() + eta.max * 60000).toISOString(),
    schedule: buildSchedule(placedAt, eta),
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
    paymentInfo,
    instructions: (instructions ?? '').trim(),
    ...(placedBy && { placedBy }),
  }
}

// Customers may cancel until the food leaves the kitchen; the restaurant (admin)
// may cancel until it is delivered.
export const ADMIN_CANCELLABLE = [STATUS.PLACED, STATUS.PREPARING, STATUS.OUT]

// Returns the fields to merge into the order, plus any instant wallet refund.
export function cancellation(order, reason, cancelledBy = 'customer') {
  const paid = order.paymentInfo?.status === 'Paid'
  // Wallet refunds are instant; card/UPI refunds go back to the source.
  const walletRefund = paid && order.paymentInfo.method === 'wallet' ? order.summary.total : 0
  return {
    walletRefund,
    change: {
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
      cancelledBy,
      ...(paid && { refund: { amount: order.summary.total, status: 'Initiated', to: order.payment } }),
    },
  }
}

// Admin status control: `target` happens now, earlier steps are pulled to now at the
// latest, and later steps keep their spacing relative to the target.
export function moveToStatus(order, target, now = Date.now()) {
  const schedule = getSchedule(order)
  const targetIndex = FLOW.indexOf(target)
  const shift = new Date(schedule[target]).getTime() - now
  return Object.fromEntries(
    FLOW.map((step, i) => {
      const time = new Date(schedule[step]).getTime()
      if (i < targetIndex) return [step, new Date(Math.min(time, now)).toISOString()]
      if (i === targetIndex) return [step, new Date(now).toISOString()]
      return [step, new Date(Math.max(time - shift, now + (i - targetIndex) * 60000)).toISOString()]
    }),
  )
}
