import { formatNumber } from '../../data/dashboardData'

export default function StatCard({ label, value, change, icon, tone }) {
  const up = change >= 0

  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span className="stat-icon" aria-hidden="true">{icon}</span>
        <span className={`stat-change ${up ? 'up' : 'down'}`}>
          <span aria-hidden="true">{up ? '▲' : '▼'}</span> {Math.abs(change)}%
          <span className="sr-only">{up ? 'increase' : 'decrease'} vs last month</span>
        </span>
      </div>
      <p className="stat-value">{formatNumber(value)}</p>
      <p className="stat-label">{label}</p>
    </article>
  )
}
