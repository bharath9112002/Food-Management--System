import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { cancelOrderAsAdmin, setOrderStatus } from '../../utils/adminData'
import { ADMIN_CANCELLABLE, getStatus, STATUS } from '../../utils/orders'
import Modal from '../Modal'

const REASONS = [
  'Restaurant is closed',
  'Item(s) out of stock',
  'Delivery address not serviceable',
  'Customer unreachable',
  'Customer requested cancellation',
  'Other',
]

// Status changes and cancellation for any customer's order, with a shared cancel dialog.
export function useAdminOrderActions() {
  const [toastEl, showToast] = useToast()
  const [cancelling, setCancelling] = useState(null)
  const [reason, setReason] = useState(REASONS[0])
  const [other, setOther] = useState('')

  function moveTo(order, target) {
    setOrderStatus(order, target)
    showToast(`${order.id} marked “${target}”`)
  }

  function askCancel(order) {
    setReason(REASONS[0])
    setOther('')
    setCancelling(order)
  }

  function confirmCancel(e) {
    e.preventDefault()
    // Re-check: the order may have been delivered while the dialog was open.
    if (!ADMIN_CANCELLABLE.includes(getStatus(cancelling))) {
      showToast('This order can no longer be cancelled', 'warning')
    } else {
      cancelOrderAsAdmin(cancelling, reason === 'Other' ? other.trim() || 'Other' : reason)
      showToast(`${cancelling.id} cancelled${cancelling.paymentInfo?.status === 'Paid' ? ' · refund initiated' : ''}`)
    }
    setCancelling(null)
  }

  const elements = (
    <>
      <Modal open={cancelling !== null} title={`Cancel ${cancelling?.id ?? ''}?`} onClose={() => setCancelling(null)} size="sm">
        <form onSubmit={confirmCancel}>
          <fieldset className="reason-list">
            <legend>Reason (shown to the customer)</legend>
            {REASONS.map((r) => (
              <label key={r} className={`choice ${reason === r ? 'selected' : ''}`}>
                <input type="radio" name="admin-reason" checked={reason === r} onChange={() => setReason(r)} />
                {r}
              </label>
            ))}
          </fieldset>
          {reason === 'Other' && (
            <div className="field">
              <div className="input-wrap">
                <textarea
                  rows={2}
                  maxLength={120}
                  aria-label="Reason"
                  placeholder="Describe the reason"
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                />
              </div>
            </div>
          )}
          {cancelling?.paymentInfo?.status === 'Paid' && (
            <p className="alert warning">This order was prepaid — a refund will be initiated automatically.</p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setCancelling(null)}>
              Keep order
            </button>
            <button type="submit" className="btn-danger">
              Cancel order
            </button>
          </div>
        </form>
      </Modal>
      {toastEl}
    </>
  )

  return { moveTo, askCancel, showToast, elements }
}

export const NEXT_ACTION = {
  [STATUS.PLACED]: { target: STATUS.PREPARING, label: 'Accept & start preparing' },
  [STATUS.PREPARING]: { target: STATUS.OUT, label: 'Hand over to rider' },
  [STATUS.OUT]: { target: STATUS.DELIVERED, label: 'Mark delivered' },
}
