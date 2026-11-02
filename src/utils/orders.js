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
