export const ADDRESS_TYPES = [
  { value: 'Home', icon: '🏠' },
  { value: 'Work', icon: '🏢' },
  { value: 'Other', icon: '📍' },
]

export const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  line1: '',
  landmark: '',
  city: '',
  pincode: '',
  type: 'Home',
}

export function formatAddress(a) {
  return [a.line1, a.landmark, `${a.city} - ${a.pincode}`].filter(Boolean).join(', ')
}
