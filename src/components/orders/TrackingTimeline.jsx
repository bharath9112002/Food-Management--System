import { FLOW, getSchedule, STATUS } from '../../utils/orders'

const STEP_INFO = {
  [STATUS.PLACED]: { icon: '🧾', text: 'We have received your order.' },
  [STATUS.PREPARING]: { icon: '👨‍🍳', text: 'The kitchen is preparing your food.' },
  [STATUS.OUT]: { icon: '🛵', text: 'Your rider has picked up the order and is on the way.' },
  [STATUS.DELIVERED]: { icon: '✅', text: 'Your order was delivered. Enjoy your meal!' },
  [STATUS.CANCELLED]: { icon: '✕', text: 'This order was cancelled.' },
}

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export default function TrackingTimeline({ order, status }) {
  const schedule = getSchedule(order)
  const currentIndex = FLOW.indexOf(status)

  // A cancelled order shows the steps it reached, then the cancellation.
  const steps =
    status === STATUS.CANCELLED
      ? [
          ...FLOW.filter((step) => new Date(schedule[step]) <= new Date(order.cancelledAt)).map((step) => ({
            step,
            state: 'done',
            time: schedule[step],
          })),
          { step: STATUS.CANCELLED, state: 'cancelled', time: order.cancelledAt },
        ]
      : FLOW.map((step, i) => ({
          step,
          state: i < currentIndex ? 'done' : i === currentIndex ? (step === STATUS.DELIVERED ? 'done' : 'current') : 'upcoming',
          time: schedule[step],
        }))

  return (
    <ol className="timeline">
      {steps.map(({ step, state, time }) => (
        <li key={step} className={`timeline-step ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
          <span className="timeline-marker" aria-hidden="true">
            {state === 'done' ? '✓' : STEP_INFO[step].icon}
          </span>
          <div className="timeline-content">
            <div className="timeline-head">
              <strong>{step}</strong>
              <time dateTime={time}>
                {state === 'upcoming' ? `Expected ${formatTime(time)}` : formatTime(time)}
              </time>
            </div>
            <p>
              {step === STATUS.CANCELLED && order.cancelReason
                ? `Reason: ${order.cancelReason}`
                : STEP_INFO[step].text}
            </p>
            {state === 'current' && <span className="sr-only">Current status</span>}
          </div>
        </li>
      ))}
    </ol>
  )
}
