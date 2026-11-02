import { Link } from 'react-router-dom'
import { formatINR } from '../../data/dashboardData'
import { isOpenNow } from '../../api/restaurants'

export function OpenBadge({ restaurant }) {
  const open = isOpenNow(restaurant)
  return (
    <span className={`open-badge ${open ? 'open' : 'closed'}`}>
      <span className="status-dot" aria-hidden="true" />
      {open ? 'Open now' : 'Closed'}
    </span>
  )
}

export function RatingChip({ rating }) {
  return (
    <span className="rating-chip" aria-label={`Rated ${rating} out of 5`}>
      ★ {rating.toFixed(1)}
    </span>
  )
}

export default function RestaurantCard({ restaurant, linkState }) {
  const { id, name, image, cuisine, rating, reviewCount, deliveryTime, deliveryFee, address } =
    restaurant

  return (
    <Link to={`/restaurants/${id}`} state={linkState} className="restaurant-card">
      <div className="restaurant-media">
        <img src={image} alt={name} loading="lazy" width="400" height="260" />
        <OpenBadge restaurant={restaurant} />
        {deliveryFee === 0 && <span className="free-badge">Free delivery</span>}
      </div>

      <div className="restaurant-body">
        <div className="restaurant-title">
          <h3>{name}</h3>
          <RatingChip rating={rating} />
        </div>
        <p className="restaurant-cuisine">
          {cuisine} · {reviewCount} reviews
        </p>

        <ul className="restaurant-meta">
          <li>
            <span aria-hidden="true">⏱</span> {deliveryTime.min}–{deliveryTime.max} min
          </li>
          <li>
            <span aria-hidden="true">🛵</span>{' '}
            {deliveryFee === 0 ? 'Free' : `${formatINR(deliveryFee)} delivery`}
          </li>
        </ul>

        <p className="restaurant-address">
          <span aria-hidden="true">📍</span> {address}
        </p>
      </div>
    </Link>
  )
}
