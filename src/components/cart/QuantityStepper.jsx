import { MAX_QTY } from '../../context/CartContext'

export default function QuantityStepper({ qty, onChange, name, size = 'md' }) {
  return (
    <div className={`stepper stepper-${size}`} role="group" aria-label={`Quantity of ${name}`}>
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label={qty === 1 ? `Remove ${name} from cart` : `Decrease ${name} quantity`}
      >
        {qty === 1 ? '🗑' : '−'}
      </button>
      <span aria-live="polite">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= MAX_QTY}
        aria-label={`Increase ${name} quantity`}
        title={qty >= MAX_QTY ? `Maximum ${MAX_QTY} per item` : undefined}
      >
        +
      </button>
    </div>
  )
}
