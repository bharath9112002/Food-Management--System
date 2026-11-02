import { STATUS_TONE } from '../../utils/orders'

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${STATUS_TONE[status]}`}>
      <span className="status-dot" aria-hidden="true" />
      {status}
    </span>
  )
}
