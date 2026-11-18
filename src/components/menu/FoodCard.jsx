import { Link } from 'react-router-dom'
import { formatINR } from '../../data/dashboardData'
import AddToCartButton from '../cart/AddToCartButton'
import { FALLBACK_IMAGE, handleImageError } from './image'

export function VegMark({ isVeg, withLabel = false }) {
  const label = isVeg ? 'Veg' : 'Non-veg'
  return (
    <span className={`veg-mark ${isVeg ? 'veg' : 'nonveg'}`} title={label}>
      <span className="veg-symbol" aria-hidden="true" />
      {withLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  )
}

export function AvailabilityBadge({ available }) {
  return (
    <span className={`availability ${available ? 'in' : 'out'}`}>
      <span className="status-dot" aria-hidden="true" />
      {available ? 'Available' : 'Unavailable'}
    </span>
  )
}

// Admins pass `manage` handlers and get edit controls; customers get add-to-cart.
export default function FoodCard({ item, manage, linkState }) {
  return (
    <article className={`food-card${item.available ? '' : ' is-unavailable'}`}>
      <Link to={`/menu/${item.id}`} state={linkState} className="food-media" tabIndex={-1} aria-hidden="true">
        <img src={item.image || FALLBACK_IMAGE} alt="" loading="lazy" onError={handleImageError} />
        <span className="food-category">{item.category}</span>
      </Link>

      <div className="food-body">
        <div className="food-title">
          <VegMark isVeg={item.isVeg} />
          <h3>
            <Link to={`/menu/${item.id}`} state={linkState}>
              {item.name}
            </Link>
          </h3>
        </div>
        <p className="food-desc">{item.description}</p>

        <div className="food-footer">
          <span className="food-price">{formatINR(item.price)}</span>
          {manage ? (
            <label className="toggle toggle-sm" title="Toggle availability">
              <input
                type="checkbox"
                checked={item.available}
                onChange={() => manage.onToggle(item)}
                aria-label={`${item.name} available`}
              />
              <span className="toggle-track" aria-hidden="true" />
              <AvailabilityBadge available={item.available} />
            </label>
          ) : (
            <AvailabilityBadge available={item.available} />
          )}
        </div>

        {manage ? (
          <div className="food-actions">
            <button type="button" className="btn-secondary" onClick={() => manage.onEdit(item)}>
              ✏️ Edit
            </button>
            <button type="button" className="btn-secondary danger" onClick={() => manage.onDelete(item)}>
              🗑️ Delete
            </button>
          </div>
        ) : (
          <AddToCartButton item={item} size="sm" />
        )}
      </div>
    </article>
  )
}
