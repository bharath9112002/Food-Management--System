import { evaluateCoupon } from './coupons'

export const MAX_QTY = 10
export const DELIVERY_FEE = 40
export const FREE_DELIVERY_FROM = 499
export const GST_RATE = 0.05

// Joins cart lines ({ id, qty, snapshot }) with the live menu so price edits and
// availability changes apply immediately. Lines keep a snapshot so a deleted dish
// still shows up (flagged) instead of vanishing.
export function priceLines(lines, menu) {
  const menuById = new Map(menu.map((i) => [i.id, i]))
  return lines.map((line) => {
    const item = menuById.get(line.id)
    const details = item ?? { ...line.snapshot, id: line.id }
    const orderable = Boolean(item?.available)
    return { ...line, item: details, removed: !item, orderable, lineTotal: details.price * line.qty }
  })
}

// Bill for the orderable entries. An applied coupon that no longer qualifies is
// returned with its reason but gives no discount.
export function computeSummary(entries, { couponCode = null, isFirstOrder = false } = {}) {
  const billable = entries.filter((e) => e.orderable)
  const itemCount = billable.reduce((sum, e) => sum + e.qty, 0)
  const subtotal = billable.reduce((sum, e) => sum + e.lineTotal, 0)
  const baseDeliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE

  const coupon = couponCode ? evaluateCoupon(couponCode, { subtotal, baseDeliveryFee, isFirstOrder }) : null
  const discount = coupon?.valid ? coupon.discount : 0
  const deliveryFee = coupon?.valid && coupon.freeDelivery ? 0 : baseDeliveryFee
  // GST is charged on the discounted item value.
  const gst = Math.round((subtotal - discount) * GST_RATE)

  return {
    coupon,
    itemCount,
    summary: {
      subtotal,
      discount,
      couponCode: coupon?.valid ? coupon.coupon.code : null,
      baseDeliveryFee,
      deliveryFee,
      gst,
      total: subtotal - discount + deliveryFee + gst,
      savings: discount + (baseDeliveryFee - deliveryFee),
    },
  }
}
