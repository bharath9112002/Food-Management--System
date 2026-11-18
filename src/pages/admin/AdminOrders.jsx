import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/orders/StatusBadge'
import Pagination from '../../components/restaurants/Pagination'
import { StateMessage } from '../../components/restaurants/StateMessage'
import { formatINR } from '../../data/dashboardData'
import { useAdminData } from '../../hooks/useAdminData'
import { getStatus, STATUS } from '../../utils/orders'

const PAGE_SIZE = 10

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: STATUS.DELIVERED, label: 'Delivered' },
  { key: STATUS.CANCELLED, label: 'Cancelled' },
]

const RANGES = [
  { key: 'all', label: 'All time', days: null },
  { key: 'today', label: 'Today', days: 0 },
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
]

const SORTS = {
  newest: { label: 'Newest first', compare: (a, b) => new Date(b.order.placedAt) - new Date(a.order.placedAt) },
  oldest: { label: 'Oldest first', compare: (a, b) => new Date(a.order.placedAt) - new Date(b.order.placedAt) },
  amount: { label: 'Amount: high to low', compare: (a, b) => b.order.summary.total - a.order.summary.total },
}

const isActiveStatus = (s) => s !== STATUS.DELIVERED && s !== STATUS.CANCELLED

function downloadCsv(rows) {
  const header = ['Order ID', 'Placed at', 'Customer', 'Email', 'Items', 'Total', 'Payment', 'Status']
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`
  const lines = rows.map(({ order, status }) =>
    [
      order.id,
      new Date(order.placedAt).toLocaleString('en-IN'),
      order.customer.name,
      order.customer.email,
      order.items.map((i) => `${i.qty}x ${i.name}`).join('; '),
      order.summary.total,
      order.payment,
      status,
    ]
      .map(escape)
      .join(','),
  )
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: `foodhub-orders-${Date.now()}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminOrders() {
  const { orders, now } = useAdminData(10000)
  const [tab, setTab] = useState('')
  const [range, setRange] = useState('all')
  const [sort, setSort] = useState('newest')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const withStatus = orders.map((order) => ({ order, status: getStatus(order, now) }))

  const days = RANGES.find((r) => r.key === range).days
  const from = days === null ? 0 : new Date(now).setHours(0, 0, 0, 0) - days * 86400000
  const q = query.trim().toLowerCase()

  const filtered = withStatus
    .filter(({ order, status }) => {
      if (tab === 'active' ? !isActiveStatus(status) : tab && status !== tab) return false
      if (new Date(order.placedAt).getTime() < from) return false
      return (
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customer.name.toLowerCase().includes(q) ||
        order.customer.email.includes(q) ||
        order.items.some((i) => i.name.toLowerCase().includes(q))
      )
    })
    .sort(SORTS[sort].compare)

  const delivered = filtered.filter(({ status }) => status === STATUS.DELIVERED)
  const revenue = delivered.reduce((sum, { order }) => sum + order.summary.total, 0)
  const kpis = [
    { label: 'Orders', value: filtered.length },
    { label: 'Delivered revenue', value: formatINR(revenue) },
    { label: 'Avg. order value', value: formatINR(delivered.length ? revenue / delivered.length : 0) },
    { label: 'Cancelled', value: filtered.filter(({ status }) => status === STATUS.CANCELLED).length },
  ]

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const reset = (fn) => (value) => {
    fn(value)
    setPage(1)
  }

  return (
    <main className="dashboard admin-page">
      <div className="page-head">
        <div>
          <h1>Order History</h1>
          <p>Every order from every customer.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => downloadCsv(filtered)} disabled={!filtered.length}>
          ⬇ Export CSV
        </button>
      </div>

      <dl className="admin-kpis">
        {kpis.map((k) => (
          <div key={k.label}>
            <dt>{k.label}</dt>
            <dd>{k.value}</dd>
          </div>
        ))}
      </dl>

      <section className="filters panel" aria-label="Filter orders">
        <div className="search-box">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search order ID, customer or dish…"
            aria-label="Search orders"
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
          />
        </div>
        <div className="filter-row">
          <div className="select-field">
            <span id="hist-status">Status</span>
            <div className="segmented" role="group" aria-labelledby="hist-status">
              {STATUS_TABS.map((t) => (
                <button key={t.label} type="button" aria-pressed={tab === t.key} onClick={() => reset(setTab)(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <label className="select-field">
            <span>Date</span>
            <select value={range} onChange={(e) => reset(setRange)(e.target.value)}>
              {RANGES.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </label>
          <label className="select-field">
            <span>Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {filtered.length === 0 ? (
        <StateMessage
          icon="🧾"
          title={orders.length ? 'No matching orders' : 'No orders yet'}
          message={orders.length ? 'Try other filters.' : 'Orders from customers will appear here.'}
        />
      ) : (
        <>
          <div className="panel table-panel">
            <div className="table-scroll">
              <table className="data-table orders-table admin-orders-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Items</th>
                    <th scope="col">Payment</th>
                    <th scope="col" className="num">Total</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ order, status }) => (
                    <tr key={`${order.userId}-${order.id}`}>
                      <td data-label="Order">
                        <Link to={`/admin/orders/${order.id}`} className="order-id mono">
                          {order.id}
                        </Link>
                        <span className="order-time">
                          {new Date(order.placedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </td>
                      <td data-label="Customer">
                        {order.customer.name}
                        {order.placedBy && <span className="order-time">📞 by {order.placedBy.name}</span>}
                      </td>
                      <td data-label="Items" className="items-cell">
                        {order.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                      </td>
                      <td data-label="Payment">{order.paymentInfo?.status === 'Paid' ? 'Prepaid' : 'COD'}</td>
                      <td data-label="Total" className="num">{formatINR(order.summary.total)}</td>
                      <td data-label="Status">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={current} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </main>
  )
}
