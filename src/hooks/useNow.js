import { useEffect, useState } from 'react'

// Current time that re-renders the component every `intervalMs`.
export function useNow(intervalMs = 10000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
