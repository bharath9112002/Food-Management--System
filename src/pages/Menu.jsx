import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CATEGORIES } from '../api/menu'
import FoodCard from '../components/menu/FoodCard'
import { useMenuEditor } from '../components/menu/useMenuEditor'
import Pagination from '../components/restaurants/Pagination'
import { CardSkeletons, StateMessage } from '../components/restaurants/StateMessage'
import { useMenu } from '../context/MenuContext'

const PAGE_SIZE = 12

const TYPES = [
  { value: '', label: 'All' },
  { value: 'veg', label: 'Veg' },
  { value: 'nonveg', label: 'Non-veg' },
]

const SORTS = {
  default: { label: 'Recommended', compare: null },
  'price-asc': { label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', compare: (a, b) => b.price - a.price },
}

const DEFAULTS = { q: '', category: '', type: '', sort: 'default', page: '1' }

export default function Menu() {
  const location = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { items, loading, error, retry, resetMenu } = useMenu()
  const editor = useMenuEditor()

  const filters = Object.fromEntries(
    Object.entries(DEFAULTS).map(([key, fallback]) => [key, params.get(key) ?? fallback]),
  )
  const sortKey = SORTS[filters.sort] ? filters.sort : 'default'

  // One-off instructions passed via navigation: open the add form (dashboard quick
  // action) or show a message (item deleted from its details page).
  const { openAdd, showToast } = editor
  useEffect(() => {
    const { openAdd: shouldOpen, toast } = location.state ?? {}
    if (!shouldOpen && !toast) return
    if (shouldOpen) openAdd()
    if (toast) showToast(toast)
    navigate(location.pathname + location.search, { replace: true, state: null })
  }, [location, navigate, openAdd, showToast])

  function update(changes) {
    const next = { ...filters, page: '1', ...changes }
    setParams(
      Object.fromEntries(Object.entries(next).filter(([key, value]) => value && value !== DEFAULTS[key])),
      { replace: !('page' in changes) },
    )
  }

  const results = useMemo(() => {
    const query = filters.q.trim().toLowerCase()
    const list = items.filter(
      (i) =>
        (!query ||
          i.name.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query) ||
          i.category.toLowerCase().includes(query)) &&
        (!filters.category || i.category === filters.category) &&
        (!filters.type || i.isVeg === (filters.type === 'veg')),
    )
    const { compare } = SORTS[sortKey]
    return compare ? list.toSorted(compare) : list
  }, [items, filters.q, filters.category, filters.type, sortKey])

  const counts = useMemo(
    () => ({
      total: items.length,
      veg: items.filter((i) => i.isVeg).length,
      available: items.filter((i) => i.available).length,
    }),
    [items],
  )

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(filters.page) || 1), totalPages)
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = filters.q || filters.category || filters.type

  function goToPage(p) {
    update({ page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleReset() {
    if (window.confirm('Reset the menu to the original items? Your changes will be lost.')) {
      resetMenu()
      setParams({})
    }
  }

  return (
    <main className="dashboard menu-page">
      <div className="page-head">
        <div>
          <h1>Menu Management</h1>
          <p>
            {counts.total} items · {counts.veg} veg · {counts.available} available
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn-secondary" onClick={handleReset} disabled={loading}>
            ↺ Reset
          </button>
          <button type="button" className="btn-primary btn-inline" onClick={editor.openAdd} disabled={loading}>
            + Add menu item
          </button>
        </div>
      </div>

      <section className="filters panel" aria-label="Search and filters">
        <div className="search-box">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search food items…"
            aria-label="Search food items"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
          />
        </div>

        <div className="filter-row">
          <div className="select-field">
            <span id="type-label">Type</span>
            <div className="segmented" role="group" aria-labelledby="type-label">
              {TYPES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  aria-pressed={filters.type === t.value}
                  onClick={() => update({ type: t.value })}
                >
                  {t.value && (
                    <span className={`veg-mark ${t.value}`} aria-hidden="true">
                      <span className="veg-symbol" />
                    </span>
                  )}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="select-field">
            <span>Sort by price</span>
            <select value={sortKey} onChange={(e) => update({ sort: e.target.value })}>
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="category-chips" role="group" aria-label="Category">
          {['', ...CATEGORIES].map((c) => (
            <button
              key={c || 'all'}
              type="button"
              className="chip"
              aria-pressed={filters.category === c}
              onClick={() => update({ category: c })}
            >
              {c || 'All categories'}
            </button>
          ))}
        </div>
      </section>

      {loading && <CardSkeletons count={8} />}

      {error && (
        <StateMessage
          icon="⚠️"
          title="Couldn't load the menu"
          message={error.message}
          action={
            <button type="button" className="btn-primary btn-inline" onClick={retry}>
              Try again
            </button>
          }
        />
      )}

      {!loading && !error && (
        <>
          <div className="results-bar">
            <p>
              <strong>{results.length}</strong> {results.length === 1 ? 'item' : 'items'}
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
            <div className="food-grid">
              {pageItems.map((item) => (
                <FoodCard
                  key={item.id}
                  item={item}
                  linkState={{ from: location.pathname + location.search }}
                  onEdit={editor.openEdit}
                  onDelete={editor.askDelete}
                  onToggle={editor.toggleAvailability}
                />
              ))}
            </div>
          ) : (
            <StateMessage
              icon="🍽️"
              title={items.length ? 'No food items found' : 'Your menu is empty'}
              message={items.length ? 'Try a different search or remove some filters.' : 'Add your first dish to get started.'}
              action={
                items.length ? (
                  <button type="button" className="btn-primary btn-inline" onClick={() => setParams({})}>
                    Clear filters
                  </button>
                ) : (
                  <button type="button" className="btn-primary btn-inline" onClick={editor.openAdd}>
                    + Add menu item
                  </button>
                )
              }
            />
          )}

          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
      )}

      {editor.elements}
    </main>
  )
}
