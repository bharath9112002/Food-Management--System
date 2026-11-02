const FLOATING_FOOD = [
  { emoji: '🍕', left: '6%', top: '8%' },
  { emoji: '🍔', left: '78%', top: '6%' },
  { emoji: '🍣', left: '88%', top: '38%' },
  { emoji: '🌮', left: '4%', top: '52%' },
  { emoji: '🍩', left: '70%', top: '70%' },
  { emoji: '🥗', left: '18%', top: '86%' },
  { emoji: '🍜', left: '50%', top: '90%' },
  { emoji: '🧁', left: '58%', top: '16%' },
]

const FEATURES = [
  { icon: '⚡', text: 'Delivery in 30 minutes or less' },
  { icon: '🍽️', text: '500+ restaurants near you' },
  { icon: '🎁', text: 'Exclusive deals every day' },
]

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-brand" aria-hidden="true">
        <div className="floating-food">
          {FLOATING_FOOD.map(({ emoji, left, top }, i) => (
            <span key={emoji} style={{ left, top, '--i': i }}>
              {emoji}
            </span>
          ))}
        </div>

        <div className="brand-content">
          <div className="brand-mark">
            <span className="brand-logo">🍔</span>
            <span className="brand-name">FoodHub</span>
          </div>
          <h2>
            Hungry? <br />
            <span className="highlight">We&apos;ve got you.</span>
          </h2>
          <p>Fresh meals from your favourite restaurants, delivered hot to your door.</p>

          <ul className="brand-features">
            {FEATURES.map((f) => (
              <li key={f.text}>
                <span className="feature-icon">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>

          <div className="brand-stats">
            <div><strong>2M+</strong><span>Happy customers</span></div>
            <div><strong>4.8★</strong><span>App rating</span></div>
            <div><strong>120+</strong><span>Cities</span></div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand">
            <span className="brand-logo">🍔</span>
            <span className="brand-name">FoodHub</span>
          </div>
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
        </div>
      </section>
    </main>
  )
}
