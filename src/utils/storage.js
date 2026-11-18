// Static "backend": registered users and the active session live in localStorage.
const USERS_KEY = 'food_users'
const SESSION_KEY = 'food_auth_user'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// Returns false when storage is full or blocked; the app keeps working in memory.
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export { read as readJSON, write as writeJSON }

export async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const ROLES = { CUSTOMER: 'customer', ADMIN: 'admin' }

export const DEMO_CREDENTIALS = [
  { role: ROLES.CUSTOMER, label: 'Customer', email: 'demo@foodhub.com', password: 'Demo@123' },
  { role: ROLES.ADMIN, label: 'Admin', email: 'admin@foodhub.com', password: 'Admin@123' },
]

// Always available so the demo credentials work on a fresh browser.
const DEMO_USERS = [
  {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@foodhub.com',
    phone: '9876543210',
    role: ROLES.CUSTOMER,
    passwordHash: 'ff96673205dc722320598ebf8f88325b2ac56922d5a2164b5765868274bc0d73',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-admin',
    name: 'Admin Manager',
    email: 'admin@foodhub.com',
    phone: '9123456780',
    role: ROLES.ADMIN,
    passwordHash: 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

// Accounts created before roles existed are customers.
const withRole = (user) => ({ ...user, role: user.role ?? ROLES.CUSTOMER })

export function getUsers() {
  const users = read(USERS_KEY, [])
  // Matched by id so demo users can still change their email in the profile.
  const missing = DEMO_USERS.filter((demo) => !users.some((u) => u.id === demo.id))
  return [...missing, ...users].map(withRole)
}
export const saveUsers = (users) => write(USERS_KEY, users)

export const findUserByEmail = (email) =>
  getUsers().find((u) => u.email === email.trim().toLowerCase())

export function getSession() {
  const session = read(SESSION_KEY, null)
  return session && withRole(session)
}
export const saveSession = (user) => write(SESSION_KEY, user)
export const clearSession = () => localStorage.removeItem(SESSION_KEY)
