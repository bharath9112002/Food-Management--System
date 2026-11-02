import { createContext, useContext, useState } from 'react'
import {
  clearSession,
  findUserByEmail,
  getSession,
  getUsers,
  hashPassword,
  saveSession,
  saveUsers,
} from '../utils/storage'

const AuthContext = createContext(null)

// Never expose the password hash to the UI or the session record.
const toPublicUser = ({ passwordHash: _passwordHash, ...user }) => user

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession)

  async function register({ name, email, phone, password }) {
    const normalizedEmail = email.trim().toLowerCase()
    if (findUserByEmail(normalizedEmail)) {
      throw new Error('An account with this email already exists')
    }
    const newUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    }
    saveUsers([...getUsers(), newUser])
    return toPublicUser(newUser)
  }

  async function login({ email, password }) {
    const found = findUserByEmail(email)
    if (!found || found.passwordHash !== (await hashPassword(password))) {
      throw new Error('Invalid email or password')
    }
    const sessionUser = {
      ...toPublicUser(found),
      loggedInAt: new Date().toISOString(),
    }
    saveSession(sessionUser)
    setUser(sessionUser)
    return sessionUser
  }

  // Writes profile changes to both the user record and the active session.
  function updateProfile(changes) {
    const next = { ...changes }
    if (next.email !== undefined) {
      next.email = next.email.trim().toLowerCase()
      const owner = findUserByEmail(next.email)
      if (owner && owner.id !== user.id) throw new Error('This email is already used by another account')
    }
    if (next.name !== undefined) next.name = next.name.trim()
    if (next.phone !== undefined) next.phone = next.phone.trim()

    const users = getUsers().map((u) => (u.id === user.id ? { ...u, ...next } : u))
    const savedUsers = saveUsers(users)
    const sessionUser = { ...user, ...next }
    const savedSession = saveSession(sessionUser)
    setUser(sessionUser)
    if (savedUsers === false || savedSession === false) {
      throw new Error('Browser storage is full — changes may be lost on refresh')
    }
    return sessionUser
  }

  function logout() {
    clearSession()
    setUser(null)
  }

  // Static flow: just confirms the account exists so the UI can show a success state.
  async function requestPasswordReset(email) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return Boolean(findUserByEmail(email))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        register,
        login,
        logout,
        updateProfile,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
