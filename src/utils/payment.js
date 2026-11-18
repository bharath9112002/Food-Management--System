import { formatINR } from '../data/dashboardData'

// Payment UI helpers and a simulated gateway. Nothing here talks to a real
// processor, and full card numbers / CVVs are never stored.

export const METHODS = {
  CARD: 'card',
  UPI: 'upi',
  WALLET: 'wallet',
  COD: 'cod',
}

export const WALLET_START_BALANCE = 500

// Test values that always fail, so the failure screen can be demoed.
export const TEST_VALUES = {
  successCard: '4111 1111 1111 1111',
  declinedCard: '4000 0000 0000 0002',
  failUpi: 'fail@upi',
}

export const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: '🟢' },
  { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
  { id: 'paytm', name: 'Paytm', icon: '🔵' },
  { id: 'bhim', name: 'BHIM', icon: '🟠' },
]

const digits = (value) => value.replace(/\D/g, '')

export function cardBrand(number) {
  const n = digits(number)
  if (/^4/.test(n)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  if (/^(60|65|81|82|508)/.test(n)) return 'RuPay'
  return ''
}

// Groups as 4-4-4-4 (Amex: 4-6-5) while typing.
export function formatCardNumber(value) {
  const n = digits(value).slice(0, 16)
  if (cardBrand(n) === 'Amex') {
    return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ')
  }
  return n.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function formatExpiry(value) {
  const n = digits(value).slice(0, 4)
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n
}

function passesLuhn(number) {
  let sum = 0
  let double = false
  for (let i = number.length - 1; i >= 0; i--) {
    let d = Number(number[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

export function validateCard({ number, name, expiry, cvv }, now = new Date()) {
  const errors = {}
  const n = digits(number)
  const amex = cardBrand(n) === 'Amex'

  if (!n) errors.number = 'Card number is required'
  else if (n.length !== (amex ? 15 : 16) || !passesLuhn(n)) errors.number = 'Enter a valid card number'

  if (!name.trim()) errors.name = 'Name on card is required'
  else if (!/^[A-Za-z\s.]{3,}$/.test(name.trim())) errors.name = 'Enter the name as printed on the card'

  const [mm, yy] = expiry.split('/')
  const month = Number(mm)
  if (!/^\d{2}\/\d{2}$/.test(expiry) || month < 1 || month > 12) errors.expiry = 'Use MM/YY'
  else {
    // A card is valid through the last day of its expiry month.
    const endOfMonth = new Date(2000 + Number(yy), month, 1)
    if (endOfMonth <= now) errors.expiry = 'This card has expired'
  }

  if (!new RegExp(`^\\d{${amex ? 4 : 3}}$`).test(cvv)) errors.cvv = `Enter the ${amex ? 4 : 3}-digit CVV`
  return errors
}

export function validateUpi(upiId) {
  if (!upiId.trim()) return 'UPI ID is required'
  if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) return 'Enter a valid UPI ID, e.g. name@okbank'
  return ''
}

const txnId = () =>
  'TXN' + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()

// Simulated gateway: resolves after a short delay with success or a decline reason.
export async function processPayment({ method, card, upiId, amount }) {
  await new Promise((resolve) => setTimeout(resolve, 1800))

  if (method === METHODS.CARD && digits(card.number) === digits(TEST_VALUES.declinedCard)) {
    return { ok: false, code: 'CARD_DECLINED', reason: 'Your card was declined by the bank.' }
  }
  if (method === METHODS.UPI && upiId.trim().toLowerCase() === TEST_VALUES.failUpi) {
    return { ok: false, code: 'UPI_TIMEOUT', reason: 'The UPI request was not approved in time.' }
  }
  if (amount <= 0) return { ok: false, code: 'INVALID_AMOUNT', reason: 'Invalid payment amount.' }

  return { ok: true, txnId: txnId(), paidAt: new Date().toISOString() }
}

// Short label kept on the order, e.g. "Visa •••• 1111".
export function describeMethod({ method, card, upiId, upiApp }) {
  if (method === METHODS.CARD) return `${cardBrand(card.number) || 'Card'} •••• ${digits(card.number).slice(-4)}`
  if (method === METHODS.UPI) return upiApp ? `UPI · ${UPI_APPS.find((a) => a.id === upiApp)?.name}` : `UPI · ${upiId.trim()}`
  if (method === METHODS.WALLET) return 'FoodHub Wallet'
  return 'Cash on Delivery'
}

export const PAYMENT_TABS = [
  { id: METHODS.UPI, label: 'UPI', icon: '📱', note: 'Google Pay, PhonePe & more' },
  { id: METHODS.CARD, label: 'Card', icon: '💳', note: 'Credit or debit card' },
  { id: METHODS.WALLET, label: 'Wallet', icon: '👛', note: 'FoodHub Wallet' },
  { id: METHODS.COD, label: 'Cash', icon: '💵', note: 'Pay on delivery' },
]

export const EMPTY_PAYMENT = {
  method: METHODS.UPI,
  upiApp: '',
  upiId: '',
  card: { number: '', name: '', expiry: '', cvv: '' },
}

export function validatePayment(payment, { amount, walletBalance }) {
  if (payment.method === METHODS.CARD) return validateCard(payment.card)
  if (payment.method === METHODS.UPI) {
    if (payment.upiApp) return {}
    const upiId = validateUpi(payment.upiId)
    return upiId ? { upiId } : {}
  }
  if (payment.method === METHODS.WALLET && walletBalance < amount) {
    return { wallet: `Insufficient balance. Add ${formatINR(amount - walletBalance)} to pay with your wallet.` }
  }
  return {}
}
