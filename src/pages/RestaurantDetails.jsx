import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchRestaurant, fetchRestaurants, formatHour } from '../api/restaurants'
import RestaurantCard, { OpenBadge, RatingChip } from '../components/restaurants/RestaurantCard'
import { ErrorState, StateMessage } from '../components/restaurants/StateMessage'
import { formatINR } from '../data/dashboardData'
import { useFetch } from '../hooks/useFetch'

async function loadDetails(id, signal) {
  const restaurant = await fetchRestaurant(id, signal)
  // Similar places are a nice-to-have; the page still works if they fail.
  const all = await fetchRestaurants(signal).catch(() => [])
  const similar = all
    .filter((r) => r.cuisine === restaurant.cuisine && r.id !== restaurant.id)
    .slice(0, 3)
  return { restaurant, similar }
}

export default function RestaurantDetails() {
  const { id } = useParams()
  const location = useLocation()
  const backTo = location.state?.from ?? '/restaurants'
  const { data, loading, error, reload } = useFetch((signal) => loadDetails(id, signal), [id])

  const backLink = (
    <Link to={backTo} className="back-link">
      ← Back to restaurants
    </Link>
  )

  if (loading) {
    return (
      <main className="dashboard" aria-busy="true">
        {backLink}
        <div className="skeleton details-hero-skeleton" />
        <div className="skeleton skeleton-line w-40" />
        <div className="skeleton skeleton-line w-70" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="dashboard">
        {backLink}
        {error.message === 'Restaurant not found' ? (
          <StateMessage
            icon="🔎"
            title="Restaurant not found"
            message="It may have been removed or the link is incorrect."
          />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </main>
    )
  }

  const { restaurant: r, similar } = data

  return (
    <main className="dashboard details-page">
      {backLink}

      <section className="details-hero">
        <img src={r.image} alt={r.name} />
        <div className="details-hero-overlay">
          <OpenBadge restaurant={r} />
          <h1>{r.name}</h1>
          <p>
            {r.cuisine} · {r.tags.join(' · ')}
          </p>
        </div>
      </section>

      <section className="details-info" aria-label="Restaurant information">
        <div className="info-tile">
          <span className="info-label">Rating</span>
          <span className="info-value">
            <RatingChip rating={r.rating} />
            <small>{r.reviewCount} reviews</small>
          </span>
        </div>
        <div className="info-tile">
          <span className="info-label">Delivery time</span>
          <span className="info-value">
            {r.deliveryTime.min}–{r.deliveryTime.max} min
          </span>
        </div>
        <div className="info-tile">
          <span className="info-label">Delivery charges</span>
          <span className="info-value">
            {r.deliveryFee === 0 ? 'Free' : formatINR(r.deliveryFee)}
          </span>
        </div>
        <div className="info-tile">
          <span className="info-label">Cost for two</span>
          <span className="info-value">{formatINR(r.costForTwo)}</span>
        </div>
      </section>

      <div className="details-grid">
        <section className="panel">
          <h2>Signature dish</h2>
          <p className="dish-name">{r.signatureDish.name}</p>
          <p className="panel-sub">
            {r.signatureDish.difficulty} to prepare · {r.signatureDish.calories} kcal per serving ·{' '}
            {r.mealType.join(', ')}
          </p>
          <h3 className="sub-heading">Ingredients</h3>
          <ul className="ingredient-list">
            {r.signatureDish.ingredients.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Location &amp; hours</h2>
          <dl className="details-list">
            <div>
              <dt>📍 Address</dt>
              <dd>{r.address}</dd>
            </div>
            <div>
              <dt>🕒 Opening hours</dt>
              <dd>
                {formatHour(r.hours.open)} – {formatHour(r.hours.close)}
              </dd>
            </div>
            <div>
              <dt>🍽️ Cuisine</dt>
              <dd>{r.cuisine}</dd>
            </div>
          </dl>
        </section>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="section-title">More {r.cuisine} restaurants</h2>
          <div className="restaurant-grid">
            {similar.map((s) => (
              <RestaurantCard key={s.id} restaurant={s} linkState={location.state} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
