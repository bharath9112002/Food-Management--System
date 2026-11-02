import { useEffect, useState } from 'react'

const ACTIONS = [
  { label: 'Add Restaurant', desc: 'Onboard a new partner', icon: '🏪', tone: 'red' },
  { label: 'Add Food Item', desc: 'Create a new menu item', icon: '🍔', tone: 'orange' },
  { label: 'Manage Orders', desc: 'Track and update orders', icon: '📦', tone: 'blue' },
  { label: 'View Customers', desc: 'See customer details', icon: '👥', tone: 'purple' },
]

export default function QuickActions() {
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 2500)
    return () => clearTimeout(timer)
  }, [notice])

  return (
    <section className="panel" aria-labelledby="actions-title">
      <div className="panel-head">
        <h2 id="actions-title">Quick Actions</h2>
      </div>

      <div className="quick-actions">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            className={`action-card tone-${a.tone}`}
            onClick={() => setNotice(`${a.label} is coming in the next module`)}
          >
            <span className="action-icon" aria-hidden="true">{a.icon}</span>
            <span className="action-text">
              <strong>{a.label}</strong>
              <span>{a.desc}</span>
            </span>
            <span className="action-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>

      <p className="toast" role="status" data-visible={Boolean(notice)}>
        {notice}
      </p>
    </section>
  )
}
