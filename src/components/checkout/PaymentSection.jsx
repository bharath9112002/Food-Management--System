import { formatINR } from '../../data/dashboardData'
import {
  cardBrand,
  formatCardNumber,
  formatExpiry,
  METHODS,
  PAYMENT_TABS,
  TEST_VALUES,
  UPI_APPS,
} from '../../utils/payment'
import { FormField } from '../FormField'

const BRAND_ICONS = { Visa: 'VISA', Mastercard: 'MC', Amex: 'AMEX', RuPay: 'RuPay' }

export default function PaymentSection({ payment, onChange, errors, touched, onBlur, amount, walletBalance, onTopUp }) {
  const show = (field) => (touched[field] ? errors[field] : '')
  const setCard = (field, value) => onChange({ card: { ...payment.card, [field]: value } })
  const brand = cardBrand(payment.card.number)

  return (
    <div className="payment-section">
      <div className="payment-tabs" role="tablist" aria-label="Payment method">
        {PAYMENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`pay-tab-${tab.id}`}
            aria-selected={payment.method === tab.id}
            aria-controls="pay-panel"
            className="payment-tab"
            onClick={() => onChange({ method: tab.id })}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <strong>{tab.label}</strong>
            <small>{tab.note}</small>
          </button>
        ))}
      </div>

      <div id="pay-panel" role="tabpanel" aria-labelledby={`pay-tab-${payment.method}`} className="payment-panel">
        {payment.method === METHODS.UPI && (
          <>
            <p className="payment-label">Pay with a UPI app</p>
            <div className="upi-apps">
              {UPI_APPS.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  className={`upi-app${payment.upiApp === app.id ? ' selected' : ''}`}
                  aria-pressed={payment.upiApp === app.id}
                  onClick={() => onChange({ upiApp: payment.upiApp === app.id ? '' : app.id, upiId: '' })}
                >
                  <span aria-hidden="true">{app.icon}</span>
                  {app.name}
                </button>
              ))}
            </div>

            <div className="or-divider"><span>or enter UPI ID</span></div>

            <FormField
              label="UPI ID"
              id="upiId"
              placeholder="yourname@okbank"
              autoComplete="off"
              value={payment.upiId}
              onChange={(e) => onChange({ upiId: e.target.value, upiApp: '' })}
              onBlur={() => onBlur('upiId')}
              error={show('upiId')}
            />
            <p className="test-hint">
              <span className="demo-badge">TEST</span> Any valid UPI ID succeeds. Use <code>{TEST_VALUES.failUpi}</code> to
              see a failed payment.
            </p>
          </>
        )}

        {payment.method === METHODS.CARD && (
          <>
            <div className="card-preview" aria-hidden="true">
              <span className="card-chip" />
              <span className="card-brand">{BRAND_ICONS[brand] ?? ''}</span>
              <span className="card-number">{payment.card.number || '•••• •••• •••• ••••'}</span>
              <div className="card-bottom">
                <span>{payment.card.name.toUpperCase() || 'NAME ON CARD'}</span>
                <span>{payment.card.expiry || 'MM/YY'}</span>
              </div>
            </div>

            <FormField
              label="Card number"
              id="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={payment.card.number}
              onChange={(e) => setCard('number', formatCardNumber(e.target.value))}
              onBlur={() => onBlur('number')}
              error={show('number')}
            />
            <FormField
              label="Name on card"
              id="cardName"
              autoComplete="cc-name"
              placeholder="As printed on the card"
              value={payment.card.name}
              onChange={(e) => setCard('name', e.target.value)}
              onBlur={() => onBlur('name')}
              error={show('name')}
            />
            <div className="form-row-2">
              <FormField
                label="Expiry"
                id="cardExpiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={payment.card.expiry}
                onChange={(e) => setCard('expiry', formatExpiry(e.target.value))}
                onBlur={() => onBlur('expiry')}
                error={show('expiry')}
              />
              <FormField
                label="CVV"
                id="cardCvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={brand === 'Amex' ? 4 : 3}
                placeholder={brand === 'Amex' ? '••••' : '•••'}
                value={payment.card.cvv}
                onChange={(e) => setCard('cvv', e.target.value.replace(/\D/g, ''))}
                onBlur={() => onBlur('cvv')}
                error={show('cvv')}
              />
            </div>
            <p className="secure-note">🔒 Card details are used only for this payment and never saved.</p>
            <p className="test-hint">
              <span className="demo-badge">TEST</span> Success: <code>{TEST_VALUES.successCard}</code> · Declined:{' '}
              <code>{TEST_VALUES.declinedCard}</code> · any future expiry and CVV.
            </p>
          </>
        )}

        {payment.method === METHODS.WALLET && (
          <div className="wallet-panel">
            <div className="wallet-card">
              <span aria-hidden="true">👛</span>
              <div>
                <span>FoodHub Wallet balance</span>
                <strong>{formatINR(walletBalance)}</strong>
              </div>
            </div>
            {errors.wallet ? (
              <>
                <p className="alert warning" role="status">{errors.wallet}</p>
                <div className="topup-row">
                  <span>Add money:</span>
                  {[amount - walletBalance, 200, 500].map((value, i) => (
                    <button key={i} type="button" className="btn-demo" onClick={() => onTopUp(Math.ceil(value))}>
                      + {formatINR(Math.ceil(value))}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="wallet-ok">
                ✓ {formatINR(amount)} will be deducted. Remaining balance:{' '}
                <strong>{formatINR(walletBalance - amount)}</strong>
              </p>
            )}
          </div>
        )}

        {payment.method === METHODS.COD && (
          <div className="cod-panel">
            <span aria-hidden="true">💵</span>
            <p>
              Pay <strong>{formatINR(amount)}</strong> in cash or by UPI when your order arrives. Please keep exact change
              handy.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
