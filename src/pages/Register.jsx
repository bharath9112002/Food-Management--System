import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { FormField, PasswordField } from '../components/FormField'
import { ArrowIcon, MailIcon, PhoneIcon, UserIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { hasErrors, passwordStrength, validateRegister } from '../utils/validation'

const INITIAL = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  terms: false,
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState(INITIAL)
  const [touched, setTouched] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const errors = validateRegister(values)
  const showError = (field) => (touched[field] ? errors[field] : '')
  const strength = passwordStrength(values.password)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }))
    setSubmitError('')
  }

  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched(Object.fromEntries(Object.keys(INITIAL).map((k) => [k, true])))
    if (hasErrors(errors)) return

    setLoading(true)
    try {
      await register(values)
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Join FoodHub and start ordering">
      {submitError && <p className="alert error" role="alert">{submitError}</p>}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Full name"
          id="name"
          autoComplete="name"
          placeholder="John Doe"
          icon={<UserIcon />}
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={showError('name')}
        />
        <FormField
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<MailIcon />}
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={showError('email')}
        />
        <FormField
          label="Phone number"
          id="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          autoComplete="tel-national"
          placeholder="9876543210"
          icon={<PhoneIcon />}
          value={values.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={showError('phone')}
        />
        <PasswordField
          label="Password"
          id="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={showError('password')}
        >
          {values.password && (
            <div className="strength" data-score={strength.score}>
              <div className="strength-bar">
                <span style={{ width: `${(strength.score / 4) * 100}%` }} />
              </div>
              <small>{strength.label}</small>
            </div>
          )}
        </PasswordField>
        <PasswordField
          label="Confirm password"
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter password"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={showError('confirmPassword')}
        />

        <div className="field">
          <label className="checkbox">
            <input
              type="checkbox"
              name="terms"
              checked={values.terms}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            I agree to the Terms &amp; Privacy Policy
          </label>
          {showError('terms') && <p className="field-error" role="alert">{errors.terms}</p>}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" aria-label="Creating account" /> : <>Create account <ArrowIcon /></>}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  )
}
