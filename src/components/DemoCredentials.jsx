import { DEMO_CREDENTIALS } from '../utils/storage'

export default function DemoCredentials({ onUse }) {
  return (
    <div className="demo-box">
      {DEMO_CREDENTIALS.map((demo) => (
        <div key={demo.role} className="demo-line">
          <span className={`demo-badge ${demo.role}`}>{demo.label}</span>
          <span className="demo-values">
            <code>{demo.email}</code> / <code>{demo.password}</code>
          </span>
          <button
            type="button"
            className="btn-demo"
            onClick={() => onUse({ email: demo.email, password: demo.password })}
            aria-label={`Use ${demo.label.toLowerCase()} demo credentials`}
          >
            Use
          </button>
        </div>
      ))}
    </div>
  )
}
