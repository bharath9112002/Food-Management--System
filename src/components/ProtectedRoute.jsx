import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Guards private pages; remembers where the user was heading.
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

// Limits a group of routes to certain roles; others go back to their own home page.
export function RoleRoute({ allow }) {
  const { user } = useAuth()
  return allow.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />
}

// Keeps logged-in users away from login/register pages.
export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}
