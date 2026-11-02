import { DEMO_CREDENTIALS } from '../utils/storage'

export default function DemoCredentials({ onUse }) {
  return (
    <div className="demo-box">
      <span className="demo-badge">DEMO</span>
      <span className="demo-values">
        <code>{DEMO_CREDENTIALS.email}</code> / <code>{DEMO_CREDENTIALS.password}</code>
      </span>
      <button type="button" className="btn-demo" onClick={() => onUse(DEMO_CREDENTIALS)}>
        Use
      </button>
    </div>
  )
}
