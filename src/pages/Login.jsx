import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import DemoCredentials from '../components/DemoCredentials'
import { FormField, PasswordField } from '../components/FormField'
import { ArrowIcon, MailIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { hasErrors, validateLogin } from '../utils/validation'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/'

  const [values, setValues] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const errors = validateLogin(values)
  const showError = (field) => (touched[field] ? errors[field] : '')

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setSubmitError('')
  }

  function fillDemo(credentials) {
    setValues(credentials)
    setTouched({})
    setSubmitError('')
  }

  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (hasErrors(errors)) return

    setLoading(true)
    try {
      await login(values)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to order your favourite food">
      {location.state?.registered && (
        <p className="alert success">Account created! Please log in.</p>
      )}
      {submitError && <p className="alert error" role="alert">{submitError}</p>}

      <form onSubmit={handleSubmit} noValidate>
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
        <PasswordField
          label="Password"
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={showError('password')}
        />

        <div className="form-row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" aria-label="Logging in" /> : <>Log in <ArrowIcon /></>}
        </button>
      </form>

      <DemoCredentials onUse={fillDemo} />

      <p className="auth-footer">
        New to FoodHub? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  )
}
