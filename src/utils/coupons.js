// Static coupon catalogue. Percent coupons are capped; every coupon has a minimum order.

export const COUPONS = [
  {
    code: 'WELCOME50',
    title: '50% off your first order',
    detail: 'Up to ₹125 off on orders above ₹199. New customers only.',
    type: 'percent',
    value: 50,
    maxDiscount: 125,
    minOrder: 199,
    firstOrderOnly: true,
  },
  {
    code: 'SAVE20',
    title: '20% off',
    detail: 'Up to ₹150 off on orders above ₹399.',
    type: 'percent',
    value: 20,
    maxDiscount: 150,
    minOrder: 399,
  },
  {
    code: 'FLAT100',
    title: 'Flat ₹100 off',
    detail: 'On orders above ₹599.',
    type: 'flat',
    value: 100,
    minOrder: 599,
  },
  {
    code: 'FREEDEL',
    title: 'Free delivery',
    detail: 'No delivery fee on orders above ₹149.',
    type: 'delivery',
    minOrder: 149,
  },
  {
    code: 'FEAST30',
    title: '30% off party orders',
    detail: 'Up to ₹250 off on orders above ₹999.',
    type: 'percent',
    value: 30,
    maxDiscount: 250,
    minOrder: 999,
    expiresAt: '2026-10-31T23:59:59+05:30',
  },
]

export const findCoupon = (code) =>
  COUPONS.find((c) => c.code === code?.trim().toUpperCase())

const rupees = (n) => `₹${n.toLocaleString('en-IN')}`

// Checks a coupon against the current cart. `reason` explains why it doesn't apply.
export function evaluateCoupon(code, { subtotal, baseDeliveryFee, isFirstOrder, now = Date.now() }) {
  const coupon = findCoupon(code)
  const none = { coupon, valid: false, discount: 0, freeDelivery: false }

  if (!coupon) return { ...none, reason: 'This coupon code is not valid' }
  if (coupon.expiresAt && now > new Date(coupon.expiresAt).getTime()) {
    return { ...none, reason: 'This coupon has expired' }
  }
  if (coupon.firstOrderOnly && !isFirstOrder) {
    return { ...none, reason: 'This coupon is only for your first order' }
  }
  if (subtotal < coupon.minOrder) {
    return { ...none, reason: `Add ${rupees(coupon.minOrder - subtotal)} more to use ${coupon.code}` }
  }

  if (coupon.type === 'delivery') {
    if (baseDeliveryFee === 0) return { ...none, reason: 'Your order already has free delivery' }
    return { coupon, valid: true, discount: 0, freeDelivery: true }
  }

  const raw = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value
  const discount = Math.min(raw, coupon.maxDiscount ?? Infinity, subtotal)
  return { coupon, valid: true, discount, freeDelivery: false }
}

export function describeSavings(result) {
  if (!result?.valid) return ''
  return result.freeDelivery ? 'Free delivery applied' : `You save ${rupees(result.discount)}`
}

export { rupees as formatRupees }
