import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../../api/menu'
import Avatar from '../../components/Avatar'
import QuantityStepper from '../../components/cart/QuantityStepper'
import { ADDRESS_TYPES, EMPTY_ADDRESS, formatAddress } from '../../components/checkout/address'
import AddressForm from '../../components/checkout/AddressForm'
import { BillDetails, OrderItemList } from '../../components/checkout/OrderItems'
import { VegMark } from '../../components/menu/FoodCard'
import { FALLBACK_IMAGE, handleImageError } from '../../components/menu/image'
import { useAuth } from '../../context/AuthContext'
import { useMenu } from '../../context/MenuContext'
import { formatINR } from '../../data/dashboardData'
import { useAdminData } from '../../hooks/useAdminData'
import { getCustomerAddresses, getCustomerOrders, placeOrderForCustomer, saveCustomerAddress } from '../../utils/adminData'
import { evaluateCoupon } from '../../utils/coupons'
import { getStatus, STATUS } from '../../utils/orders'
import { computeSummary, MAX_QTY, priceLines } from '../../utils/pricing'
import { validateAddress } from '../../utils/validation'

const PAYMENT_OPTIONS = [
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', note: 'Customer pays the rider' },
  { id: 'phone', label: 'Paid over phone', icon: '📞', note: 'UPI/card payment already taken' },
]

const NEW_ADDRESS = 'new'

// Phone payments are recorded with a manual reference instead of a gateway ID.
function paymentInfoFor(option, amount) {
  if (option !== 'phone') return { method: 'cod', status: 'Pay on delivery', amount }
  const now = new Date()
  return { method: 'phone', status: 'Paid', txnId: `MANUAL-${now.getTime().toString(36).toUpperCase()}`, paidAt: now.toISOString(), amount }
}

export default function AdminPlaceOrder() {
  const { user: admin } = useAuth()
  const { items: menu, loading } = useMenu()
  const { customers } = useAdminData()
  const navigate = useNavigate()

  const [customerId, setCustomerId] = useState(null)
  const [customerQuery, setCustomerQuery] = useState('')
  const [lines, setLines] = useState([]) // [{ id, qty }]
  const [dishQuery, setDishQuery] = useState('')
  const [category, setCategory] = useState('')
  const [addressId, setAddressId] = useState(NEW_ADDRESS)
  const [form, setForm] = useState(EMPTY_ADDRESS)
  const [touched, setTouched] = useState({})
  const [saveAddress, setSaveAddress] = useState(true)
  const [payment, setPayment] = useState('cod')
  const [couponInput, setCouponInput] = useState('')
  const [couponCode, setCouponCode] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)

  const customer = customers.find((c) => c.id === customerId) ?? null
  const addresses = useMemo(() => (customer ? getCustomerAddresses(customer.id) : []), [customer])
  const isFirstOrder = useMemo(
    () => customer && !getCustomerOrders(customer.id).some((o) => getStatus(o) !== STATUS.CANCELLED),
    [customer],
  )

  const entries = priceLines(lines, menu)
  const { summary, itemCount, coupon } = computeSummary(entries, { couponCode, isFirstOrder })
  const usingNew = addressId === NEW_ADDRESS || !addresses.some((a) => a.id === addressId)
  const formErrors = validateAddress(form)

  function chooseCustomer(c) {
    setCustomerId(c.id)
    const saved = getCustomerAddresses(c.id)
    setAddressId(saved[0]?.id ?? NEW_ADDRESS)
    setForm({ ...EMPTY_ADDRESS, fullName: c.name, phone: c.phone ?? '' })
    setTouched({})
    setCouponCode(null)
    setError('')
  }

  const qtyOf = (id) => lines.find((l) => l.id === id)?.qty ?? 0
  function setQty(id, qty) {
    setLines((current) =>
      qty <= 0
        ? current.filter((l) => l.id !== id)
        : current.some((l) => l.id === id)
          ? current.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l))
          : [...current, { id, qty: 1 }],
    )
  }

  function applyCoupon(e) {
    e.preventDefault()
    const result = evaluateCoupon(couponInput, {
      subtotal: summary.subtotal,
      baseDeliveryFee: summary.baseDeliveryFee,
      isFirstOrder,
    })
    if (result.valid) {
      setCouponCode(result.coupon.code)
      setCouponInput('')
      setCouponError('')
    } else {
      setCouponError(result.reason)
    }
  }

  const dq = dishQuery.trim().toLowerCase()
  const dishes = menu.filter(
    (i) => i.available && (!category || i.category === category) && (!dq || i.name.toLowerCase().includes(dq)),
  )

  const cq = customerQuery.trim().toLowerCase()
  const customerMatches = customers.filter(
    (c) => !cq || c.name.toLowerCase().includes(cq) || c.email.includes(cq) || (c.phone ?? '').includes(cq),
  )

  async function handlePlace() {
    setError('')
    if (!customer) return setError('Select a customer first.')
    if (itemCount === 0) return setError('Add at least one dish.')
    let address
    if (usingNew) {
      setTouched(Object.fromEntries(Object.keys(EMPTY_ADDRESS).map((k) => [k, true])))
      if (Object.keys(formErrors).length) return setError('Please complete the delivery address.')
      const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))
      address = saveAddress ? saveCustomerAddress(customer.id, clean) : clean
    } else {
      address = addresses.find((a) => a.id === addressId)
    }

    setPlacing(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const paidByPhone = payment === 'phone'
    const order = placeOrderForCustomer(
      customer,
      {
        entries: entries.filter((e) => e.orderable),
        summary,
        address,
        payment: paidByPhone ? 'Paid over phone (Paid)' : 'Cash on Delivery',
        paymentInfo: paymentInfoFor(payment, summary.total),
        instructions,
      },
      admin,
    )
    navigate(`/admin/orders/${order.id}`, { state: { toast: `Order ${order.id} placed for ${customer.name}` } })
  }

  return (
    <main className="dashboard admin-page">
      <div className="page-head">
        <div>
          <h1>Place Order</h1>
          <p>Create an order on behalf of a customer, e.g. a phone order.</p>
        </div>
      </div>

      <div className="cart-layout">
        <div className="checkout-steps">
          <section className="panel" aria-labelledby="po-customer">
            <h2 id="po-customer" className="step-title">
              <span className="step-num">1</span> Customer
            </h2>
            {customer ? (
              <div className="selected-customer">
                <Avatar user={customer} size={44} />
                <div>
                  <strong>{customer.name}</strong>
                  <span>
                    {customer.email} · {customer.phone}
                  </span>
                </div>
                <button type="button" className="link-btn" onClick={() => setCustomerId(null)}>
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="search-box">
                  <span aria-hidden="true">🔍</span>
                  <input
                    type="search"
                    placeholder="Search by name, email or phone…"
                    aria-label="Search customers"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                  />
                </div>
                <ul className="customer-pick">
                  {customerMatches.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => chooseCustomer(c)}>
                        <Avatar user={c} size={36} />
                        <span>
                          <strong>{c.name}</strong>
                          <small>
                            {c.email} · {c.phone}
                          </small>
                        </span>
                        <span className="order-track">Select</span>
                      </button>
                    </li>
                  ))}
                  {customerMatches.length === 0 && <li className="muted">No customers match.</li>}
                </ul>
              </>
            )}
          </section>

          <section className="panel" aria-labelledby="po-items">
            <h2 id="po-items" className="step-title">
              <span className="step-num">2</span> Dishes
            </h2>
            <div className="search-box">
              <span aria-hidden="true">🔍</span>
              <input
                type="search"
                placeholder="Search dishes…"
                aria-label="Search dishes"
                value={dishQuery}
                onChange={(e) => setDishQuery(e.target.value)}
              />
            </div>
            <div className="category-chips po-chips" role="group" aria-label="Category">
              {['', ...CATEGORIES].map((c) => (
                <button key={c || 'all'} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
                  {c || 'All'}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="skeleton skeleton-line w-70" />
            ) : (
              <ul className="dish-pick">
                {dishes.map((d) => {
                  const qty = qtyOf(d.id)
                  return (
                    <li key={d.id} className={qty ? 'picked' : ''}>
                      <img src={d.image || FALLBACK_IMAGE} alt="" onError={handleImageError} />
                      <VegMark isVeg={d.isVeg} />
                      <span className="line-name">{d.name}</span>
                      <span className="line-price">{formatINR(d.price)}</span>
                      {qty ? (
                        <QuantityStepper qty={qty} name={d.name} size="sm" onChange={(n) => setQty(d.id, n)} />
                      ) : (
                        <button type="button" className="btn-add btn-add-xs" onClick={() => setQty(d.id, 1)}>
                          + Add
                        </button>
                      )}
                    </li>
                  )
                })}
                {dishes.length === 0 && <li className="muted">No available dishes match.</li>}
              </ul>
            )}
          </section>

          <section className="panel" aria-labelledby="po-address">
            <h2 id="po-address" className="step-title">
              <span className="step-num">3</span> Delivery address
            </h2>
            {!customer ? (
              <p className="muted">Select a customer to choose an address.</p>
            ) : (
              <>
                {addresses.length > 0 && (
                  <div className="address-options" role="radiogroup" aria-label="Saved addresses">
                    {addresses.map((a) => (
                      <label key={a.id} className={`address-card ${addressId === a.id ? 'selected' : ''}`}>
                        <input type="radio" name="po-address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                        <span className="address-card-body">
                          <strong>
                            {ADDRESS_TYPES.find((t) => t.value === a.type)?.icon} {a.type}
                          </strong>
                          <span className="address-text">{formatAddress(a)}</span>
                        </span>
                      </label>
                    ))}
                    <label className={`address-card add-new ${usingNew ? 'selected' : ''}`}>
                      <input type="radio" name="po-address" checked={usingNew} onChange={() => setAddressId(NEW_ADDRESS)} />
                      <span className="address-card-body">
                        <strong>+ New address</strong>
                      </span>
                    </label>
                  </div>
                )}
                {usingNew && (
                  <>
                    <AddressForm
                      values={form}
                      errors={formErrors}
                      touched={touched}
                      onChange={(name, value) => setForm((f) => ({ ...f, [name]: value }))}
                      onBlur={(name) => setTouched((t) => ({ ...t, [name]: true }))}
                    />
                    <label className="checkbox">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                      Save to the customer&apos;s addresses
                    </label>
                  </>
                )}
              </>
            )}
          </section>

          <section className="panel" aria-labelledby="po-payment">
            <h2 id="po-payment" className="step-title">
              <span className="step-num">4</span> Payment &amp; notes
            </h2>
            <div className="payment-options" role="radiogroup" aria-label="Payment">
              {PAYMENT_OPTIONS.map((p) => (
                <label key={p.id} className={`address-card ${payment === p.id ? 'selected' : ''}`}>
                  <input type="radio" name="po-payment" checked={payment === p.id} onChange={() => setPayment(p.id)} />
                  <span className="payment-icon" aria-hidden="true">{p.icon}</span>
                  <span className="address-card-body">
                    <strong>{p.label}</strong>
                    <span>{p.note}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="field po-notes">
              <div className="input-wrap">
                <textarea
                  rows={2}
                  maxLength={150}
                  aria-label="Delivery instructions"
                  placeholder="Delivery instructions (optional)"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="panel cart-summary" aria-labelledby="po-summary">
          <h2 id="po-summary">Order Summary</h2>
          {itemCount === 0 ? (
            <p className="muted">No dishes added yet.</p>
          ) : (
            <OrderItemList items={entries.map((e) => ({ ...e.item, qty: e.qty, lineTotal: e.lineTotal }))} />
          )}

          {coupon ? (
            <div className={`coupon-applied${coupon.valid ? '' : ' invalid'}`}>
              <span className="coupon-icon" aria-hidden="true">🏷️</span>
              <div>
                <strong>{coupon.coupon?.code}</strong>
                <span>{coupon.valid ? `Saving ${formatINR(summary.savings)}` : coupon.reason}</span>
              </div>
              <button type="button" className="link-btn" onClick={() => setCouponCode(null)}>
                Remove
              </button>
            </div>
          ) : (
            <form className="coupon-form" onSubmit={applyCoupon} noValidate>
              <span aria-hidden="true">🏷️</span>
              <input
                type="text"
                placeholder="Coupon code"
                aria-label="Coupon code"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase())
                  setCouponError('')
                }}
              />
              <button type="submit" disabled={!couponInput.trim() || !customer}>
                Apply
              </button>
            </form>
          )}
          {couponError && <p className="field-error" role="alert">{couponError}</p>}

          <BillDetails summary={summary} itemCount={itemCount} />

          {error && <p className="alert error" role="alert">{error}</p>}
          <button type="button" className="btn-primary" onClick={handlePlace} disabled={placing}>
            {placing ? (
              <>
                <span className="spinner" aria-hidden="true" /> Placing order…
              </>
            ) : (
              <>Place order · {formatINR(summary.total)}</>
            )}
          </button>
          {customer && <p className="summary-note">Order will appear in {customer.name.split(' ')[0]}&apos;s My Orders.</p>}
        </aside>
      </div>
    </main>
  )
}
