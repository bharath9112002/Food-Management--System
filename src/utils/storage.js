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

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be full or blocked; the app keeps working in memory.
  }
}

export async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const DEMO_CREDENTIALS = { email: 'demo@foodhub.com', password: 'Demo@123' }

// Always available so the demo credentials work on a fresh browser.
const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: DEMO_CREDENTIALS.email,
  phone: '9876543210',
  passwordHash: 'ff96673205dc722320598ebf8f88325b2ac56922d5a2164b5765868274bc0d73',
  createdAt: '2026-01-01T00:00:00.000Z',
}

export function getUsers() {
  const users = read(USERS_KEY, [])
  return users.some((u) => u.email === DEMO_USER.email) ? users : [DEMO_USER, ...users]
}
export const saveUsers = (users) => write(USERS_KEY, users)

export const findUserByEmail = (email) =>
  getUsers().find((u) => u.email === email.trim().toLowerCase())

export const getSession = () => read(SESSION_KEY, null)
export const saveSession = (user) => write(SESSION_KEY, user)
export const clearSession = () => localStorage.removeItem(SESSION_KEY)
