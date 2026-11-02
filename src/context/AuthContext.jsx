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
      value={{ user, isAuthenticated: Boolean(user), register, login, logout, requestPasswordReset }}
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
