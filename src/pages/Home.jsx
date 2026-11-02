import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🍔', name: 'Burgers' },
  { emoji: '🍛', name: 'Biryani' },
  { emoji: '🍣', name: 'Sushi' },
  { emoji: '🥗', name: 'Healthy' },
  { emoji: '🍩', name: 'Desserts' },
]

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="home">
      <header className="navbar">
        <span className="nav-brand">🍔 FoodHub</span>
        <div className="nav-user">
          <span className="avatar" aria-hidden="true">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="nav-name">{user.name}</span>
          <button type="button" className="btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="home-content">
        <section className="hero-banner">
          <div>
            <p className="hero-eyebrow">{greeting()},</p>
            <h1>{user.name.split(' ')[0]} 👋</h1>
            <p>What would you like to eat today?</p>
          </div>
          <span className="hero-emoji" aria-hidden="true">🍱</span>
        </section>

        <h2 className="section-title">Explore categories</h2>
        <ul className="categories">
          {CATEGORIES.map((c) => (
            <li key={c.name}>
              <span className="category-emoji">{c.emoji}</span>
              {c.name}
            </li>
          ))}
        </ul>

        <h2 className="section-title">Your profile</h2>
        <dl className="profile-card">
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Phone</dt><dd>{user.phone}</dd></div>
          <div><dt>Member since</dt><dd>{new Date(user.createdAt).toLocaleDateString()}</dd></div>
          <div><dt>Last login</dt><dd>{new Date(user.loggedInAt).toLocaleString()}</dd></div>
        </dl>
      </main>
    </div>
  )
}
