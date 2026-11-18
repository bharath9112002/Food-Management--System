import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import CartButton from './cart/CartButton'

const NAV = {
  admin: [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/restaurants', label: 'Restaurants', icon: '🏪' },
    { to: '/menu', label: 'Menu Management', icon: '🍱' },
    { to: '/admin/carts', label: 'Customer Carts', icon: '🛒' },
    { to: '/admin/place-order', label: 'Place Order', icon: '📝' },
    { to: '/admin/tracking', label: 'Order Tracking', icon: '📍' },
    { to: '/admin/orders', label: 'Order History', icon: '🧾' },
    { label: 'Customers', icon: '👥' },
    { to: '/profile', label: 'My Profile', icon: '👤' },
  ],
  customer: [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/restaurants', label: 'Restaurants', icon: '🏪' },
    { to: '/menu', label: 'Menu', icon: '🍱' },
    { to: '/cart', label: 'Cart', icon: '🛒' },
    { to: '/orders', label: 'Order History', icon: '🧾' },
    { to: '/profile', label: 'My Profile', icon: '👤' },
  ],
}

export default function DashboardLayout() {
  const { user, isAdmin, logout } = useAuth()
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
          <span className={`role-badge ${user.role}`}>{isAdmin ? 'Admin' : 'Customer'}</span>
        </div>

        <nav aria-label="Main">
          <ul className="sidebar-nav">
            {NAV[isAdmin ? 'admin' : 'customer'].map((item) => (
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

          {!isAdmin && <CartButton />}

          <Link to="/profile" className="topbar-user" aria-label="My profile">
            <div className="topbar-user-text">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <Avatar user={user} />
          </Link>
        </header>

        <Outlet />
      </div>
    </div>
  )
}
