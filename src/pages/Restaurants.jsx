import { useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { fetchRestaurants, isOpenNow } from '../api/restaurants'
import Pagination from '../components/restaurants/Pagination'
import RestaurantCard from '../components/restaurants/RestaurantCard'
import { CardSkeletons, ErrorState, StateMessage } from '../components/restaurants/StateMessage'
import { useFetch } from '../hooks/useFetch'

const PAGE_SIZE = 9

const RATINGS = [
  { value: '', label: 'Any' },
  { value: '4', label: '4.0+' },
  { value: '4.5', label: '4.5+' },
  { value: '4.8', label: '4.8+' },
]

const SORTS = {
  popularity: { label: 'Popularity', compare: (a, b) => b.reviewCount - a.reviewCount },
  rating: { label: 'Rating: high to low', compare: (a, b) => b.rating - a.rating },
  delivery: { label: 'Fastest delivery', compare: (a, b) => a.deliveryTime.min - b.deliveryTime.min },
  fee: { label: 'Delivery fee: low to high', compare: (a, b) => a.deliveryFee - b.deliveryFee },
  name: { label: 'Name: A to Z', compare: (a, b) => a.name.localeCompare(b.name) },
}

const DEFAULTS = { q: '', cuisine: '', rating: '', sort: 'popularity', open: '', page: '1' }

export default function Restaurants() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const { data, loading, error, reload } = useFetch(fetchRestaurants, [])

  const filters = Object.fromEntries(
    Object.entries(DEFAULTS).map(([key, fallback]) => [key, params.get(key) ?? fallback]),
  )
  const sortKey = SORTS[filters.sort] ? filters.sort : 'popularity'

  // Any filter change resets to page 1; empty/default values are dropped from the URL.
  function update(changes) {
    const next = { ...filters, page: '1', ...changes }
    setParams(
      Object.fromEntries(Object.entries(next).filter(([key, value]) => value && value !== DEFAULTS[key])),
      { replace: !('page' in changes) },
    )
  }

  const cuisines = useMemo(
    () => (data ? [...new Set(data.map((r) => r.cuisine))].sort() : []),
    [data],
  )

  const results = useMemo(() => {
    if (!data) return []
    const query = filters.q.trim().toLowerCase()
    const minRating = Number(filters.rating) || 0

    return data
      .filter(
        (r) =>
          (!query ||
            r.name.toLowerCase().includes(query) ||
            r.cuisine.toLowerCase().includes(query) ||
            r.signatureDish.name.toLowerCase().includes(query)) &&
          (!filters.cuisine || r.cuisine === filters.cuisine) &&
          r.rating >= minRating &&
          (!filters.open || isOpenNow(r)),
      )
      .sort(SORTS[sortKey].compare)
  }, [data, filters.q, filters.cuisine, filters.rating, filters.open, sortKey])

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(filters.page) || 1), totalPages)
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = filters.q || filters.cuisine || filters.rating || filters.open

  function goToPage(p) {
    update({ page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="dashboard restaurants-page">
      <div className="page-head">
        <div>
          <h1>Restaurants</h1>
          <p>Discover the best places to eat near you.</p>
        </div>
      </div>

      <section className="filters panel" aria-label="Search and filters">
        <div className="search-box">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search restaurants, cuisines or dishes…"
            aria-label="Search restaurants"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
          />
        </div>

        <div className="filter-row">
          <label className="select-field">
            <span>Cuisine</span>
            <select value={filters.cuisine} onChange={(e) => update({ cuisine: e.target.value })}>
              <option value="">All cuisines</option>
              {cuisines.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="select-field">
            <span id="rating-label">Rating</span>
            <div className="segmented" role="group" aria-labelledby="rating-label">
              {RATINGS.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  aria-pressed={filters.rating === r.value}
                  onClick={() => update({ rating: r.value })}
                >
                  {r.value && '★ '}
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <label className="select-field">
            <span>Sort by</span>
            <select value={sortKey} onChange={(e) => update({ sort: e.target.value })}>
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="toggle">
            <input
              type="checkbox"
              checked={Boolean(filters.open)}
              onChange={(e) => update({ open: e.target.checked ? '1' : '' })}
            />
            <span className="toggle-track" aria-hidden="true" />
            Open now
          </label>
        </div>
      </section>

      {loading && <CardSkeletons count={PAGE_SIZE} />}

      {error && <ErrorState error={error} onRetry={reload} />}

      {data && (
        <>
          <div className="results-bar">
            <p>
              <strong>{results.length}</strong> {results.length === 1 ? 'restaurant' : 'restaurants'}
              {results.length > 0 && (
                <> · showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, results.length)}</>
              )}
            </p>
            {hasFilters && (
              <button type="button" className="link-btn" onClick={() => setParams({})}>
                Clear filters
              </button>
            )}
          </div>

          {pageItems.length > 0 ? (
            <div className="restaurant-grid">
              {pageItems.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  linkState={{ from: location.pathname + location.search }}
                />
              ))}
            </div>
          ) : (
            <StateMessage
              icon="🍽️"
              title="No restaurants found"
              message="Try a different search or remove some filters."
              action={
                <button type="button" className="btn-primary btn-inline" onClick={() => setParams({})}>
                  Clear filters
                </button>
              }
            />
          )}

          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
      )}
    </main>
  )
}
