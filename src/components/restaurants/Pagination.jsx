// Page numbers with ellipses, e.g. 1 … 4 5 6 … 12
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const result = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(`gap-${p}`)
    result.push(p)
  })
  return result
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1}>
        ← Prev
      </button>

      <ol>
        {pageList(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <li key={p} className="page-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={p === page ? 'current' : ''}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ol>

      <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages}>
        Next →
      </button>
    </nav>
  )
}
