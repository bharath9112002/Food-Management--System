import { useState } from 'react'
import { formatCompactINR, formatINR, formatNumber } from '../../data/dashboardData'

const RANGES = [
  { key: 6, label: '6M' },
  { key: 12, label: '12M' },
]

// Rounds the axis max up to a clean step so gridlines land on readable values.
function niceMax(value) {
  const step = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / step) * step
}

export default function RevenueChart({ data }) {
  const [range, setRange] = useState(12)
  const [view, setView] = useState('chart')
  const [active, setActive] = useState(null)

  const points = data.slice(-range)
  const total = points.reduce((sum, p) => sum + p.revenue, 0)
  const orders = points.reduce((sum, p) => sum + p.orders, 0)
  const latest = points.at(-1)
  const previous = points.at(-2)
  const growth = ((latest.revenue - previous.revenue) / previous.revenue) * 100

  const max = niceMax(Math.max(...points.map((p) => p.revenue)))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)

  return (
    <section className="panel revenue-panel" aria-labelledby="revenue-title">
      <div className="panel-head">
        <div>
          <h2 id="revenue-title">Revenue Summary</h2>
          <p className="panel-sub">Monthly revenue, last {range} months</p>
        </div>
        <div className="panel-controls">
          <div className="segmented" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={range === r.key}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'chart'} onClick={() => setView('chart')}>
              Chart
            </button>
            <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>
              Table
            </button>
          </div>
        </div>
      </div>

      <dl className="revenue-kpis">
        <div>
          <dt>Total revenue</dt>
          <dd>{formatINR(total)}</dd>
        </div>
        <div>
          <dt>This month</dt>
          <dd>
            {formatINR(latest.revenue)}
            <span className={`kpi-delta ${growth >= 0 ? 'up' : 'down'}`}>
              {growth >= 0 ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
            </span>
          </dd>
        </div>
        <div>
          <dt>Avg. order value</dt>
          <dd>{formatINR(total / orders)}</dd>
        </div>
      </dl>

      {view === 'chart' ? (
        <div className="bar-chart" onMouseLeave={() => setActive(null)}>
          <div className="y-axis" aria-hidden="true">
            {ticks.toReversed().map((t) => (
              <span key={t}>{formatCompactINR(t)}</span>
            ))}
          </div>

          <div className="plot">
            <div className="gridlines" aria-hidden="true">
              {ticks.map((t) => (
                <span key={t} style={{ bottom: `${(t / max) * 100}%` }} />
              ))}
            </div>

            <ol className="bars">
              {points.map((p, i) => {
                const isActive = active === i
                return (
                  <li key={`${p.month}-${p.year}`}>
                    <button
                      type="button"
                      className={`bar-hit${isActive ? ' active' : ''}`}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      aria-label={`${p.month} ${p.year}: ${formatINR(p.revenue)} from ${formatNumber(p.orders)} orders`}
                    >
                      <span className="bar" style={{ height: `${(p.revenue / max) * 100}%` }} />
                      {isActive && (
                        <span
                          className={`tooltip${i > points.length / 2 ? ' left' : ''}`}
                          style={{ bottom: `${(p.revenue / max) * 100}%` }}
                          role="status"
                        >
                          <strong>{p.month} {p.year}</strong>
                          <span>{formatINR(p.revenue)}</span>
                          <span className="tooltip-muted">{formatNumber(p.orders)} orders</span>
                        </span>
                      )}
                    </button>
                    <span className="x-label">{p.month}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col" className="num">Orders</th>
                <th scope="col" className="num">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {points.toReversed().map((p) => (
                <tr key={`${p.month}-${p.year}`}>
                  <td>{p.month} {p.year}</td>
                  <td className="num">{formatNumber(p.orders)}</td>
                  <td className="num">{formatINR(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
