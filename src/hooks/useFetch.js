import { useCallback, useEffect, useState } from 'react'

// Runs an async loader with loading/error state; `reload` retries after a failure.
export function useFetch(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))

    loader(controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ data: null, loading: false, error })
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const reload = useCallback(() => setAttempt((a) => a + 1), [])
  return { ...state, reload }
}
