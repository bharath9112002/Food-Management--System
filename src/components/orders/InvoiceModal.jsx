import { formatINR } from '../../data/dashboardData'
import { getStatus, STATUS } from '../../utils/orders'
import { GST_RATE } from '../../utils/pricing'
import { formatAddress } from '../checkout/address'
import Modal from '../Modal'

const formatDate = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

// Prints only the invoice: the browser's print dialog offers "Save as PDF".
function printInvoice() {
  document.body.classList.add('printing-invoice')
  const cleanup = () => {
    document.body.classList.remove('printing-invoice')
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}

export default function InvoiceModal({ order, customer, onClose }) {
  const status = order ? getStatus(order) : null
  // GST is split equally into central and state tax for intra-state supply.
  const halfGst = order ? order.summary.gst / 2 : 0

  return (
    <Modal open={order !== null} title="Invoice" onClose={onClose} size="lg">
      {order && (
        <>
          <article className="invoice-sheet" aria-label={`Invoice for order ${order.id}`}>
            {status === STATUS.CANCELLED && <span className="invoice-stamp">Cancelled</span>}

            <header className="invoice-head">
              <div>
                <div className="invoice-brand">
                  <span aria-hidden="true">🍔</span> FoodHub
                </div>
                <p>FoodHub Technologies Pvt. Ltd.</p>
                <p>GSTIN: 29ABCDE1234F1Z5 (sample)</p>
              </div>
              <div className="invoice-meta">
                <h3>TAX INVOICE</h3>
                <dl>
                  <div><dt>Invoice no.</dt><dd className="mono">INV-{order.id.replace('FH-', '')}</dd></div>
                  <div><dt>Order ID</dt><dd className="mono">{order.id}</dd></div>
                  <div><dt>Date</dt><dd>{formatDate(order.placedAt)}</dd></div>
                </dl>
              </div>
            </header>

            <section className="invoice-parties">
              <div>
                <h4>Billed to</h4>
                <p><strong>{customer?.name ?? order.address.fullName}</strong></p>
                {customer?.email && <p>{customer.email}</p>}
                <p>{order.address.phone}</p>
              </div>
              <div>
                <h4>Delivered to</h4>
                <p><strong>{order.address.fullName}</strong> ({order.address.type})</p>
                <p>{formatAddress(order.address)}</p>
              </div>
            </section>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Item</th>
                  <th scope="col" className="num">Qty</th>
                  <th scope="col" className="num">Rate</th>
                  <th scope="col" className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td>
                      {item.name} <small>({item.isVeg ? 'Veg' : 'Non-veg'})</small>
                    </td>
                    <td className="num">{item.qty}</td>
                    <td className="num">{formatINR(item.price)}</td>
                    <td className="num">{formatINR(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="invoice-totals">
              <div><dt>Item total</dt><dd>{formatINR(order.summary.subtotal)}</dd></div>
              {order.summary.discount > 0 && (
                <div><dt>Discount ({order.summary.couponCode})</dt><dd>−{formatINR(order.summary.discount)}</dd></div>
              )}
              <div><dt>Delivery fee</dt><dd>{order.summary.deliveryFee ? formatINR(order.summary.deliveryFee) : 'FREE'}</dd></div>
              <div><dt>CGST ({(GST_RATE * 50).toFixed(1)}%)</dt><dd>{formatINR(halfGst)}</dd></div>
              <div><dt>SGST ({(GST_RATE * 50).toFixed(1)}%)</dt><dd>{formatINR(halfGst)}</dd></div>
              <div className="invoice-grand"><dt>Grand total</dt><dd>{formatINR(order.summary.total)}</dd></div>
            </dl>

            <section className="invoice-payment">
              <p>
                <strong>Payment:</strong> {order.payment.replace(' (Paid)', '')} ·{' '}
                {order.paymentInfo?.status ?? (order.payment.includes('Delivery') ? 'Pay on delivery' : 'Paid')}
                {order.paymentInfo?.txnId && <> · Txn <span className="mono">{order.paymentInfo.txnId}</span></>}
              </p>
              {order.refund && (
                <p>
                  <strong>Refund:</strong> {formatINR(order.refund.amount)} to {order.refund.to.replace(' (Paid)', '')} ({order.refund.status})
                </p>
              )}
            </section>

            <footer className="invoice-foot">
              Thank you for ordering with FoodHub! This is a computer-generated invoice and does not require a signature.
            </footer>
          </article>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn-primary btn-inline" onClick={printInvoice}>
              ⬇ Download PDF
            </button>
          </div>
          <p className="invoice-hint">Choose “Save as PDF” in the print dialog to download.</p>
        </>
      )}
    </Modal>
  )
}
