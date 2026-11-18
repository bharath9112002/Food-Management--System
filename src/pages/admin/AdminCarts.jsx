import { useMemo, useState } from 'react'
import Avatar from '../../components/Avatar'
import { VegMark } from '../../components/menu/FoodCard'
import { FALLBACK_IMAGE, handleImageError } from '../../components/menu/image'
import { StateMessage } from '../../components/restaurants/StateMessage'
import { useMenu } from '../../context/MenuContext'
import { formatINR } from '../../data/dashboardData'
import { useAdminData } from '../../hooks/useAdminData'
import { computeSummary, priceLines } from '../../utils/pricing'

const timeAgo = (ms, now) => {
  const minutes = Math.round((now - ms) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`
}

export default function AdminCarts() {
  const { carts, now } = useAdminData()
  const { items: menu } = useMenu()
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)

  const active = useMemo(
    () =>
      carts
        .filter((c) => c.lines.length > 0)
        .map(({ customer, lines }) => {
          const entries = priceLines(lines, menu)
          const { summary, itemCount } = computeSummary(entries)
          const updatedAt = Math.max(...lines.map((l) => l.addedAt ?? 0))
          return { customer, entries, summary, itemCount, updatedAt }
        })
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [carts, menu],
  )

  const q = query.trim().toLowerCase()
  const visible = active.filter(
    ({ customer, entries }) =>
      !q ||
      customer.name.toLowerCase().includes(q) ||
      customer.email.includes(q) ||
      entries.some((e) => e.item.name.toLowerCase().includes(q)),
  )

  const totals = {
    carts: active.length,
    items: active.reduce((sum, c) => sum + c.itemCount, 0),
    value: active.reduce((sum, c) => sum + c.summary.total, 0),
  }

  return (
    <main className="dashboard admin-page">
      <div className="page-head">
        <div>
          <h1>Customer Carts</h1>
          <p>Live view of what customers have added but not ordered yet.</p>
        </div>
      </div>

      <dl className="admin-kpis">
        <div><dt>Active carts</dt><dd>{totals.carts}</dd></div>
        <div><dt>Items in carts</dt><dd>{totals.items}</dd></div>
        <div><dt>Potential revenue</dt><dd>{formatINR(totals.value)}</dd></div>
      </dl>

      <section className="filters panel" aria-label="Search carts">
        <div className="search-box">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search by customer or dish…"
            aria-label="Search carts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      {visible.length === 0 ? (
        <StateMessage
          icon="🛒"
          title={active.length ? 'No matching carts' : 'No active carts'}
          message={active.length ? 'Try a different search.' : 'Customer carts will appear here as soon as they add dishes.'}
        />
      ) : (
        <ul className="admin-list">
          {visible.map(({ customer, entries, summary, itemCount, updatedAt }) => {
            const open = expanded === customer.id
            const unavailable = entries.filter((e) => !e.orderable).length
            return (
              <li key={customer.id} className="panel admin-cart">
                <button
                  type="button"
                  className="admin-cart-head"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : customer.id)}
                >
                  <Avatar user={customer} size={42} />
                  <span className="admin-cart-who">
                    <strong>{customer.name}</strong>
                    <span>
                      {customer.email} · {customer.phone}
                    </span>
                  </span>
                  <span className="admin-cart-meta">
                    <strong>{formatINR(summary.total)}</strong>
                    <span>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} · updated {updatedAt ? timeAgo(updatedAt, now) : '—'}
                    </span>
                  </span>
                  <span className="chevron" aria-hidden="true">{open ? '▴' : '▾'}</span>
                </button>

                {open && (
                  <div className="admin-cart-body">
                    {unavailable > 0 && (
                      <p className="alert warning">
                        {unavailable} {unavailable === 1 ? 'item is' : 'items are'} unavailable and not counted.
                      </p>
                    )}
                    <ul className="admin-cart-lines">
                      {entries.map((e) => (
                        <li key={e.id} className={e.orderable ? '' : 'unavailable'}>
                          <img src={e.item.image || FALLBACK_IMAGE} alt="" onError={handleImageError} />
                          <VegMark isVeg={e.item.isVeg} />
                          <span className="line-name">
                            {e.item.name}
                            {!e.orderable && <small> · {e.removed ? 'removed' : 'unavailable'}</small>}
                          </span>
                          <span className="line-qty">× {e.qty}</span>
                          <strong>{e.orderable ? formatINR(e.lineTotal) : '—'}</strong>
                        </li>
                      ))}
                    </ul>
                    <p className="admin-cart-total">
                      Subtotal {formatINR(summary.subtotal)} · Delivery {formatINR(summary.deliveryFee)} · GST{' '}
                      {formatINR(summary.gst)} · <strong>Total {formatINR(summary.total)}</strong>
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
