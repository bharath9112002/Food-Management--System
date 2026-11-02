import { useRef, useState } from 'react'
import Avatar from '../components/Avatar'
import { ADDRESS_TYPES, EMPTY_ADDRESS, formatAddress } from '../components/checkout/address'
import AddressForm from '../components/checkout/AddressForm'
import { FormField } from '../components/FormField'
import { MailIcon, PhoneIcon, UserIcon } from '../components/Icons'
import Modal, { ConfirmDialog } from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../context/OrdersContext'
import { formatINR } from '../data/dashboardData'
import { useToast } from '../hooks/useToast'
import { checkImageFile, resizeImage } from '../utils/image'
import { getStatus, STATUS } from '../utils/orders'
import { validateAddress, validateProfile } from '../utils/validation'

const ADDRESS_FIELDS = Object.keys(EMPTY_ADDRESS)

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { orders, addresses, saveAddress, deleteAddress, setDefaultAddress } = useOrders()
  const [toastEl, showToast] = useToast()
  const fileInput = useRef(null)

  // Personal info editing
  const [editing, setEditing] = useState(false)
  const [info, setInfo] = useState({ name: '', email: '', phone: '' })
  const [infoTouched, setInfoTouched] = useState({})
  const [infoError, setInfoError] = useState('')
  const infoErrors = validateProfile(info)

  // Address modal
  const [addressModal, setAddressModal] = useState(null) // null | 'new' | address
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS)
  const [addressTouched, setAddressTouched] = useState({})
  const [deleting, setDeleting] = useState(null)
  const addressErrors = validateAddress(addressForm)

  const delivered = orders.filter((o) => getStatus(o) === STATUS.DELIVERED)
  const stats = [
    { label: 'Orders', value: orders.length },
    { label: 'Delivered', value: delivered.length },
    { label: 'Total spent', value: formatINR(delivered.reduce((sum, o) => sum + o.summary.total, 0)) },
    { label: 'Addresses', value: addresses.length },
  ]

  function startEditing() {
    setInfo({ name: user.name, email: user.email, phone: user.phone ?? '' })
    setInfoTouched({})
    setInfoError('')
    setEditing(true)
  }

  function saveInfo(e) {
    e.preventDefault()
    setInfoTouched({ name: true, email: true, phone: true })
    if (Object.keys(infoErrors).length) return
    try {
      updateProfile(info)
      setEditing(false)
      showToast('Profile updated')
    } catch (err) {
      setInfoError(err.message)
    }
  }

  async function handleAvatar(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    const problem = checkImageFile(file)
    if (problem) return showToast(problem, 'warning')
    try {
      updateProfile({ avatar: await resizeImage(file, { maxSide: 256, square: true }) })
      showToast('Profile photo updated')
    } catch (err) {
      showToast(err.message, 'warning')
    }
  }

  function removeAvatar() {
    updateProfile({ avatar: null })
    showToast('Profile photo removed')
  }

  function openAddress(address) {
    setAddressForm(
      address === 'new' ? { ...EMPTY_ADDRESS, fullName: user.name, phone: user.phone ?? '' } : { ...EMPTY_ADDRESS, ...address },
    )
    setAddressTouched({})
    setAddressModal(address)
  }

  function submitAddress(e) {
    e.preventDefault()
    setAddressTouched(Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, true])))
    if (Object.keys(addressErrors).length) return
    const clean = Object.fromEntries(
      Object.entries(addressForm).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
    )
    saveAddress(clean)
    showToast(addressModal === 'new' ? 'Address added' : 'Address updated')
    setAddressModal(null)
  }

  function confirmDelete() {
    deleteAddress(deleting.id)
    showToast('Address deleted')
    setDeleting(null)
  }

  return (
    <main className="dashboard profile-page">
      <div className="page-head">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal details and delivery addresses.</p>
        </div>
      </div>

      <section className="profile-hero panel">
        <div className="profile-avatar-wrap">
          <Avatar user={user} size={104} className="profile-avatar" />
          <button
            type="button"
            className="avatar-edit"
            onClick={() => fileInput.current.click()}
            aria-label={user.avatar ? 'Change profile photo' : 'Upload profile photo'}
            title={user.avatar ? 'Change photo' : 'Upload photo'}
          >
            📷
          </button>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={handleAvatar} />
        </div>

        <div className="profile-hero-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <p className="muted">
            Member since{' '}
            {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
          <div className="profile-photo-actions">
            <button type="button" className="link-btn" onClick={() => fileInput.current.click()}>
              {user.avatar ? 'Change photo' : 'Upload photo'}
            </button>
            {user.avatar && (
              <button type="button" className="link-btn muted-link" onClick={removeAvatar}>
                Remove
              </button>
            )}
          </div>
        </div>

        <dl className="profile-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <dd>{s.value}</dd>
              <dt>{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <div className="profile-grid">
        <section className="panel" aria-labelledby="info-title">
          <div className="panel-head">
            <h2 id="info-title">Personal information</h2>
            {!editing && (
              <button type="button" className="btn-secondary" onClick={startEditing}>
                ✏️ Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={saveInfo} noValidate>
              {infoError && <p className="alert error" role="alert">{infoError}</p>}
              {[
                { key: 'name', label: 'Full name', icon: <UserIcon />, autoComplete: 'name' },
                { key: 'email', label: 'Email', icon: <MailIcon />, type: 'email', autoComplete: 'email' },
                {
                  key: 'phone',
                  label: 'Mobile number',
                  icon: <PhoneIcon />,
                  type: 'tel',
                  inputMode: 'numeric',
                  maxLength: 10,
                  autoComplete: 'tel-national',
                },
              ].map(({ key, ...props }) => (
                <FormField
                  key={key}
                  id={`profile-${key}`}
                  name={key}
                  value={info[key]}
                  onChange={(e) => {
                    setInfo((v) => ({ ...v, [key]: e.target.value }))
                    setInfoError('')
                  }}
                  onBlur={() => setInfoTouched((t) => ({ ...t, [key]: true }))}
                  error={infoTouched[key] ? infoErrors[key] : ''}
                  {...props}
                />
              ))}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-inline">
                  Save changes
                </button>
              </div>
            </form>
          ) : (
            <dl className="info-list">
              <div>
                <dt><UserIcon /> Full name</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt><MailIcon /> Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt><PhoneIcon /> Mobile number</dt>
                <dd>{user.phone ? `+91 ${user.phone.slice(0, 5)} ${user.phone.slice(5)}` : 'Not added'}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="panel" aria-labelledby="addresses-title">
          <div className="panel-head">
            <div>
              <h2 id="addresses-title">Saved addresses</h2>
              <p className="panel-sub">Your default address is pre-selected at checkout.</p>
            </div>
            <button type="button" className="btn-primary btn-inline" onClick={() => openAddress('new')}>
              + Add address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="address-empty">
              <span aria-hidden="true">📍</span>
              <p>No saved addresses yet. Add one to check out faster.</p>
            </div>
          ) : (
            <ul className="saved-addresses">
              {addresses.map((a, i) => {
                const type = ADDRESS_TYPES.find((t) => t.value === a.type)
                return (
                  <li key={a.id} className={`saved-address${i === 0 ? ' is-default' : ''}`}>
                    <div className="saved-address-head">
                      <strong>
                        {type?.icon} {a.type}
                      </strong>
                      {i === 0 && <span className="default-badge">Default</span>}
                    </div>
                    <p className="saved-address-name">
                      {a.fullName} · {a.phone}
                    </p>
                    <p className="saved-address-text">{formatAddress(a)}</p>
                    <div className="saved-address-actions">
                      <button type="button" className="link-btn" onClick={() => openAddress(a)}>
                        Edit
                      </button>
                      <button type="button" className="link-btn danger-link" onClick={() => setDeleting(a)}>
                        Delete
                      </button>
                      {i !== 0 && (
                        <button
                          type="button"
                          className="link-btn muted-link"
                          onClick={() => {
                            setDefaultAddress(a.id)
                            showToast(`${a.type} address set as default`)
                          }}
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <Modal
        open={addressModal !== null}
        title={addressModal === 'new' ? 'Add new address' : 'Edit address'}
        onClose={() => setAddressModal(null)}
      >
        <form onSubmit={submitAddress} noValidate>
          <AddressForm
            values={addressForm}
            errors={addressErrors}
            touched={addressTouched}
            onChange={(name, value) => setAddressForm((f) => ({ ...f, [name]: value }))}
            onBlur={(name) => setAddressTouched((t) => ({ ...t, [name]: true }))}
          />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setAddressModal(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-inline">
              {addressModal === 'new' ? 'Save address' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this address?"
        message={deleting && `${deleting.type}: ${formatAddress(deleting)}`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />

      {toastEl}
    </main>
  )
}
