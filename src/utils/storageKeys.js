// Per-user localStorage keys, shared by the customer's own providers and the admin tools.
export const cartKey = (userId) => `food_cart_${userId}`
export const couponKey = (userId) => `food_coupon_${userId}`
export const ordersKey = (userId) => `food_orders_${userId}`
export const addressesKey = (userId) => `food_addresses_${userId}`
export const walletKey = (userId) => `food_wallet_${userId}`
