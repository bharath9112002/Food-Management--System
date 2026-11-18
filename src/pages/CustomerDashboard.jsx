import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AddToCartButton from '../components/cart/AddToCartButton'
import { VegMark } from '../components/menu/FoodCard'
import { FALLBACK_IMAGE, handleImageError } from '../components/menu/image'
import StatusBadge from '../components/orders/StatusBadge'
import { CATEGORIES } from '../api/menu'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useMenu } from '../context/MenuContext'
import { useOrders } from '../context/OrdersContext'
import { formatINR } from '../data/dashboardData'
import { useNow } from '../hooks/useNow'
import { getSchedule, getStatus, STATUS } from '../utils/orders'

const CATEGORY_ICONS = {
  Breakfast: '🥞',
  Lunch: '🍛',
  Dinner: '🍝',
  Appetizer: '🥟',
  Snack: '🍟',
  Dessert: '🍰',
  Beverage: '🥤',
}

function getGreeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export default function CustomerDashboard() {
  const { user } = useAuth()
  const { items: menu, loading } = useMenu()
  const { orders } = useOrders()
  const { totalQty, summary } = useCart()
  const navigate = useNavigate()
  const now = useNow(10000)
  const [greeting] = useState(getGreeting)
  const [query, setQuery] = useState('')

  const withStatus = orders.map((o) => ({ order: o, status: getStatus(o, now) }))
  const active = withStatus.filter(({ status }) => status !== STATUS.DELIVERED && status !== STATUS.CANCELLED)
  const delivered = withStatus.filter(({ status }) => status === STATUS.DELIVERED)
  const spent = delivered.reduce((sum, { order }) => sum + order.summary.total, 0)

  const popular = menu
    .filter((i) => i.available)
    .toSorted((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 4)

  const stats = [
    { label: 'Total orders', value: orders.length, icon: '🧾', tone: 'blue' },
    { label: 'Active orders', value: active.length, icon: '🛵', tone: 'amber' },
    { label: 'Delivered', value: delivered.length, icon: '✅', tone: 'green' },
    { label: 'Total spent', value: formatINR(spent), icon: '💰', tone: 'purple' },
  ]

  function handleSearch(e) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/menu?q=${encodeURIComponent(q)}` : '/menu')
  }

  return (
    <main className="dashboard customer-home">
      <section className="welcome-banner">
        <div className="welcome-text">
          <p className="hero-eyebrow">
            {greeting}, {user.name.split(' ')[0]} 👋
          </p>
          <h1>What are you craving today?</h1>
          <form className="welcome-search" onSubmit={handleSearch} role="search">
            <span aria-hidden="true">🔍</span>
            <input
              type="search"
              placeholder="Search for biryani, pizza, desserts…"
              aria-label="Search the menu"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>
        <span className="welcome-emoji" aria-hidden="true">🍱</span>
      </section>

      {active.length > 0 && (
        <section className="active-orders" aria-label="Active orders">
          {active.slice(0, 2).map(({ order, status }) => {
            const deliverAt = getSchedule(order)[STATUS.DELIVERED]
            const minutesLeft = Math.max(1, Math.ceil((new Date(deliverAt).getTime() - now) / 60000))
            return (
              <Link key={order.id} to={`/orders/${order.id}`} className="active-order-card">
                <span className="active-order-icon" aria-hidden="true">
                  {status === STATUS.OUT ? '🛵' : '👨‍🍳'}
                </span>
                <div className="active-order-info">
                  <div className="active-order-head">
                    <strong>Arriving in {minutesLeft} min</strong>
                    <StatusBadge status={status} />
                  </div>
                  <span>
                    <span className="mono">{order.id}</span> · by {formatTime(deliverAt)} ·{' '}
                    {order.items.length} {order.items.length === 1 ? 'dish' : 'dishes'}
                  </span>
                </div>
                <span className="order-track">Track →</span>
              </Link>
            )
          })}
        </section>
      )}

      <section className="stats-grid" aria-label="Your activity">
        {stats.map((s) => (
          <article key={s.label} className={`stat-card tone-${s.tone}`}>
            <div className="stat-top">
              <span className="stat-icon" aria-hidden="true">{s.icon}</span>
            </div>
            <p className="stat-value">{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </article>
        ))}
      </section>

      {totalQty > 0 && (
        <Link to="/cart" className="cart-reminder">
          <span aria-hidden="true">🛒</span>
          <span>
            You have <strong>{totalQty}</strong> {totalQty === 1 ? 'item' : 'items'} in your cart ·{' '}
            <strong>{formatINR(summary.total)}</strong>
          </span>
          <span className="order-track">View cart →</span>
        </Link>
      )}

      <section aria-labelledby="categories-title">
        <h2 id="categories-title" className="section-title">Browse by category</h2>
        <div className="category-tiles">
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/menu?category=${encodeURIComponent(c)}`} className="category-tile">
              <span aria-hidden="true">{CATEGORY_ICONS[c] ?? '🍽️'}</span>
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="popular-title">
        <div className="section-head">
          <h2 id="popular-title" className="section-title">Top rated dishes</h2>
          <Link to="/menu">See full menu →</Link>
        </div>
        {loading ? (
          <div className="popular-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton popular-skeleton" />
            ))}
          </div>
        ) : (
          <div className="popular-grid">
            {popular.map((item) => (
              <article key={item.id} className="popular-card">
                <Link to={`/menu/${item.id}`} className="popular-media" tabIndex={-1} aria-hidden="true">
                  <img src={item.image || FALLBACK_IMAGE} alt="" loading="lazy" onError={handleImageError} />
                  {item.rating > 0 && <span className="popular-rating">★ {item.rating}</span>}
                </Link>
                <div className="popular-body">
                  <div className="food-title">
                    <VegMark isVeg={item.isVeg} />
                    <h3>
                      <Link to={`/menu/${item.id}`}>{item.name}</Link>
                    </h3>
                  </div>
                  <div className="popular-footer">
                    <span className="food-price">{formatINR(item.price)}</span>
                  </div>
                  <AddToCartButton item={item} size="sm" />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="recent-title">
        <div className="panel-head">
          <h2 id="recent-title">Recent orders</h2>
          {orders.length > 0 && <Link to="/orders">View all →</Link>}
        </div>
        {orders.length === 0 ? (
          <div className="address-empty">
            <span aria-hidden="true">🧾</span>
            <p>You haven&apos;t ordered yet. Your orders will appear here.</p>
            <Link to="/menu" className="btn-primary btn-inline btn-link">
              Start ordering
            </Link>
          </div>
        ) : (
          <ul className="recent-orders">
            {withStatus.slice(0, 4).map(({ order, status }) => (
              <li key={order.id}>
                <Link to={`/orders/${order.id}`} className="recent-order">
                  <div>
                    <strong className="mono">{order.id}</strong>
                    <span>
                      {new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ·{' '}
                      {order.items.map((i) => i.name).join(', ')}
                    </span>
                  </div>
                  <div className="recent-order-side">
                    <StatusBadge status={status} />
                    <strong>{formatINR(order.summary.total)}</strong>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
