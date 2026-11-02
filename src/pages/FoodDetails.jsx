import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AddToCartButton from '../components/cart/AddToCartButton'
import { AvailabilityBadge, VegMark } from '../components/menu/FoodCard'
import { FALLBACK_IMAGE, handleImageError } from '../components/menu/image'
import { useMenuEditor } from '../components/menu/useMenuEditor'
import { StateMessage } from '../components/restaurants/StateMessage'
import { useMenu } from '../context/MenuContext'
import { formatINR } from '../data/dashboardData'

export default function FoodDetails() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { items, loading, error, retry } = useMenu()
  const backTo = location.state?.from ?? '/menu'
  const editor = useMenuEditor({
    onDeleted: (deleted, saved) =>
      navigate(backTo, { replace: true, state: { toast: saved ? `“${deleted.name}” deleted` : null } }),
  })

  const item = items.find((i) => i.id === id)
  const related = item
    ? items.filter((i) => i.category === item.category && i.id !== item.id).slice(0, 4)
    : []

  const backLink = (
    <Link to={backTo} className="back-link">
      ← Back to menu
    </Link>
  )

  if (loading) {
    return (
      <main className="dashboard" aria-busy="true">
        {backLink}
        <div className="skeleton details-hero-skeleton" />
      </main>
    )
  }

  if (error || !item) {
    return (
      <main className="dashboard">
        {backLink}
        <StateMessage
          icon={error ? '⚠️' : '🔎'}
          title={error ? "Couldn't load the menu" : 'Food item not found'}
          message={error ? error.message : 'It may have been deleted or the link is incorrect.'}
          action={
            error && (
              <button type="button" className="btn-primary btn-inline" onClick={retry}>
                Try again
              </button>
            )
          }
        />
      </main>
    )
  }

  return (
    <main className="dashboard food-details">
      {backLink}

      <section className="food-detail-card panel">
        <div className="food-detail-media">
          <img src={item.image || FALLBACK_IMAGE} alt={item.name} onError={handleImageError} />
        </div>

        <div className="food-detail-body">
          <div className="food-detail-tags">
            <VegMark isVeg={item.isVeg} withLabel />
            <span className="chip static">{item.category}</span>
            <AvailabilityBadge available={item.available} />
          </div>

          <h1>{item.name}</h1>
          <p className="food-detail-desc">{item.description}</p>
          <div className="food-detail-buy">
            <p className="food-detail-price">{formatINR(item.price)}</p>
            <AddToCartButton item={item} />
          </div>

          {(item.cuisine || item.prepTime || item.calories) && (
            <dl className="food-facts">
              {item.cuisine && <div><dt>Cuisine</dt><dd>{item.cuisine}</dd></div>}
              {item.prepTime > 0 && <div><dt>Prep time</dt><dd>{item.prepTime} min</dd></div>}
              {item.calories > 0 && <div><dt>Calories</dt><dd>{item.calories} kcal</dd></div>}
              {item.rating > 0 && <div><dt>Rating</dt><dd>★ {item.rating}</dd></div>}
            </dl>
          )}

          {item.ingredients?.length > 0 && (
            <>
              <h2 className="sub-heading">Ingredients</h2>
              <ul className="ingredient-list">
                {item.ingredients.map((ing) => (
                  <li key={ing}>{ing}</li>
                ))}
              </ul>
            </>
          )}

          {item.restaurantId && (
            <p className="served-at">
              <Link to={`/restaurants/${item.restaurantId}`}>🏪 View the restaurant serving this →</Link>
            </p>
          )}

          <div className="food-detail-actions">
            <button type="button" className="btn-primary btn-inline" onClick={() => editor.openEdit(item)}>
              ✏️ Edit item
            </button>
            <button type="button" className="btn-secondary" onClick={() => editor.toggleAvailability(item)}>
              {item.available ? 'Mark unavailable' : 'Mark available'}
            </button>
            <button type="button" className="btn-secondary danger" onClick={() => editor.askDelete(item)}>
              🗑️ Delete
            </button>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="section-title">More in {item.category}</h2>
          <div className="related-list">
            {related.map((r) => (
              <Link key={r.id} to={`/menu/${r.id}`} state={location.state} className="related-item">
                <img src={r.image || FALLBACK_IMAGE} alt="" onError={handleImageError} />
                <span>
                  <VegMark isVeg={r.isVeg} /> {r.name}
                  <strong>{formatINR(r.price)}</strong>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {editor.elements}
    </main>
  )
}
