export function StateMessage({ icon, title, message, action }) {
  return (
    <div className="state-message" role={icon === '⚠️' ? 'alert' : 'status'}>
      <span className="state-icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <StateMessage
      icon="⚠️"
      title="Couldn't load restaurants"
      message={error?.message}
      action={
        <button type="button" className="btn-primary btn-inline" onClick={onRetry}>
          Try again
        </button>
      }
    />
  )
}

export function CardSkeletons({ count }) {
  return (
    <div className="restaurant-grid" aria-busy="true" aria-label="Loading restaurants">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="restaurant-card skeleton-card" aria-hidden="true">
          <div className="skeleton skeleton-media" />
          <div className="restaurant-body">
            <div className="skeleton skeleton-line w-70" />
            <div className="skeleton skeleton-line w-40" />
            <div className="skeleton skeleton-line w-90" />
          </div>
        </div>
      ))}
    </div>
  )
}
