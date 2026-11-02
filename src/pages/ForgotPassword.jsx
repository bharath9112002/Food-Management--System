import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { MailIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { validateEmail } from '../utils/validation'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const error = validateEmail(email)

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (error) return

    setLoading(true)
    await requestPasswordReset(email)
    setLoading(false)
    // Same message whether or not the account exists, so emails can't be probed.
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout title="Check your inbox">
        <div className="success-icon" aria-hidden="true">📬</div>
        <p className="alert success">
          If an account exists for <strong>{email}</strong>, a password reset link has been sent.
        </p>
        <Link to="/login" className="btn-primary btn-link">
          Back to login
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your registered email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<MailIcon />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched ? error : ''}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-footer">
        Remembered it? <Link to="/login">Back to login</Link>
      </p>
    </AuthLayout>
  )
}
