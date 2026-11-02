import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CartButton from './cart/CartButton'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/restaurants', label: 'Restaurants', icon: '🏪' },
  { to: '/menu', label: 'Menu Items', icon: '🍱' },
  { to: '/cart', label: 'Cart', icon: '🛒' },
  { label: 'Orders', icon: '🧾' },
  { label: 'Customers', icon: '👥' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`app-shell${menuOpen ? ' menu-open' : ''}`}>
      <aside className="sidebar" id="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true">🍔</span>
          FoodHub
        </div>

        <nav aria-label="Main">
          <ul className="sidebar-nav">
            {NAV.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <NavLink to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)}>
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ) : (
                  <span className="nav-disabled" aria-disabled="true">
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                    <small>Soon</small>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          <span aria-hidden="true">🚪</span> Logout
        </button>
      </aside>

      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Open menu"
            aria-controls="sidebar"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <CartButton />

          <div className="topbar-user">
            <div className="topbar-user-text">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <span className="avatar" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  )
}
