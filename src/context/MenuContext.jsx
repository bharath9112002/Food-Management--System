import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { fetchSeedMenu } from '../api/menu'
import { readJSON, writeJSON } from '../utils/storage'

const MENU_KEY = 'food_menu'
const MenuContext = createContext(null)

export function MenuProvider({ children }) {
  const [items, setItems] = useState(() => readJSON(MENU_KEY, null))
  const [error, setError] = useState(null)
  const loading = items === null && !error

  // First visit (or after a reset/retry): pull the starting menu from the API.
  useEffect(() => {
    if (items !== null || error) return
    const controller = new AbortController()

    fetchSeedMenu(controller.signal)
      .then((seed) => {
        setItems(seed)
        writeJSON(MENU_KEY, seed)
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err)
      })

    return () => controller.abort()
  }, [items, error])

  // Applies a change and persists it; reports whether storage accepted it.
  const commit = useCallback((next) => {
    setItems(next)
    return writeJSON(MENU_KEY, next)
  }, [])

  function addItem(data) {
    const item = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    return { item, saved: commit([item, ...items]) }
  }

  function updateItem(id, changes) {
    return { saved: commit(items.map((i) => (i.id === id ? { ...i, ...changes } : i))) }
  }

  function deleteItem(id) {
    return { saved: commit(items.filter((i) => i.id !== id)) }
  }

  function resetMenu() {
    try {
      localStorage.removeItem(MENU_KEY)
    } catch {
      // Storage blocked; the reload below still refetches the seed.
    }
    setError(null)
    setItems(null)
  }

  return (
    <MenuContext.Provider
      value={{
        items: items ?? [],
        loading,
        error,
        retry: () => setError(null),
        addItem,
        updateItem,
        deleteItem,
        resetMenu,
      }}
    >
      {children}
    </MenuContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used inside <MenuProvider>')
  return ctx
}
