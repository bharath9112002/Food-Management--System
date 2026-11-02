export default function Avatar({ user, size = 40, className = '' }) {
  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {user.avatar ? <img src={user.avatar} alt="" /> : user.name.charAt(0).toUpperCase()}
    </span>
  )
}
