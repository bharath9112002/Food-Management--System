import { useCallback, useEffect, useState } from 'react'

// Returns [toastElement, showToast]; render the element once per page.
export function useToast() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const show = useCallback((message, tone = 'success') => setToast({ message, tone, at: Date.now() }), [])

  const element = (
    <p className={`toast-fixed ${toast?.tone ?? ''}`} role="status" data-visible={Boolean(toast)}>
      {toast?.message}
    </p>
  )

  return [element, show]
}
