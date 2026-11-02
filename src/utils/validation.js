const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[6-9]\d{9}$/

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required'
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address'
  return ''
}

export function validatePassword(password) {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter'
  if (!/[a-z]/.test(password)) return 'Include at least one lowercase letter'
  if (!/\d/.test(password)) return 'Include at least one number'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Include at least one special character'
  return ''
}

export function validateLogin({ email, password }) {
  return {
    email: validateEmail(email),
    password: password ? '' : 'Password is required',
  }
}

export function validateRegister({ name, email, phone, password, confirmPassword, terms }) {
  const errors = {
    name: '',
    email: validateEmail(email),
    phone: '',
    password: validatePassword(password),
    confirmPassword: '',
    terms: '',
  }

  if (!name.trim()) errors.name = 'Full name is required'
  else if (name.trim().length < 3) errors.name = 'Name must be at least 3 characters'
  else if (!/^[A-Za-z\s.]+$/.test(name.trim())) errors.name = 'Name can only contain letters'

  if (!phone.trim()) errors.phone = 'Phone number is required'
  else if (!PHONE_RE.test(phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number'

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password'
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match'

  if (!terms) errors.terms = 'You must accept the terms'

  return errors
}

export const hasErrors = (errors) => Object.values(errors).some(Boolean)

export function passwordStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score] }
}

export function validateAddress({ fullName, phone, line1, city, pincode }) {
  const errors = {}

  if (!fullName.trim()) errors.fullName = 'Full name is required'
  else if (fullName.trim().length < 3) errors.fullName = 'Name must be at least 3 characters'
  else if (!/^[A-Za-z\s.]+$/.test(fullName.trim())) errors.fullName = 'Name can only contain letters'

  if (!phone.trim()) errors.phone = 'Phone number is required'
  else if (!PHONE_RE.test(phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number'

  if (!line1.trim()) errors.line1 = 'Address is required'
  else if (line1.trim().length < 10) errors.line1 = 'Add house/flat number, street and area'

  if (!city.trim()) errors.city = 'City is required'
  else if (!/^[A-Za-z\s.-]+$/.test(city.trim())) errors.city = 'Enter a valid city name'

  if (!pincode.trim()) errors.pincode = 'Pincode is required'
  else if (!/^[1-9]\d{5}$/.test(pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode'

  return errors
}
