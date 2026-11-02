import { useState } from 'react'
import { EyeIcon, EyeOffIcon, LockIcon } from './Icons'

export function FormField({ label, id, error, icon, ...inputProps }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`input-wrap${error ? ' invalid' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={id}
          name={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function PasswordField({ label, id, error, children, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`input-wrap${error ? ' invalid' : ''}`}>
        <span className="input-icon">
          <LockIcon />
        </span>
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        <button
          type="button"
          className="toggle-visibility"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
