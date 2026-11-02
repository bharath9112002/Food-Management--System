import { useCallback, useState } from 'react'
import { useMenu } from '../../context/MenuContext'
import { useToast } from '../../hooks/useToast'
import Modal, { ConfirmDialog } from '../Modal'
import MenuItemForm from './MenuItemForm'

const STORAGE_FULL = 'Saved for now, but browser storage is full — this change may be lost on refresh.'

// Add / edit / delete / availability flows shared by the menu list and details page.
export function useMenuEditor({ onDeleted } = {}) {
  const { addItem, updateItem, deleteItem } = useMenu()
  const [toastEl, showToast] = useToast()
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [deleting, setDeleting] = useState(null)
  const openAdd = useCallback(() => setEditing('new'), [])

  function notify(saved, message) {
    showToast(saved ? message : STORAGE_FULL, saved ? 'success' : 'warning')
  }

  function handleSubmit(values) {
    if (editing === 'new') {
      const { saved } = addItem(values)
      notify(saved, `“${values.name}” added to the menu`)
    } else {
      const { saved } = updateItem(editing.id, values)
      notify(saved, `“${values.name}” updated`)
    }
    setEditing(null)
  }

  function confirmDelete() {
    const { saved } = deleteItem(deleting.id)
    setDeleting(null)
    // A details page navigates away on delete, so it shows the message itself.
    if (onDeleted) onDeleted(deleting, saved)
    else notify(saved, `“${deleting.name}” deleted`)
  }

  function toggleAvailability(item) {
    const { saved } = updateItem(item.id, { available: !item.available })
    notify(saved, `“${item.name}” marked ${item.available ? 'unavailable' : 'available'}`)
  }

  const elements = (
    <>
      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add menu item' : 'Edit menu item'}
        onClose={() => setEditing(null)}
        size="lg"
      >
        <MenuItemForm
          key={editing === 'new' ? 'new' : editing?.id}
          initial={editing === 'new' ? null : editing}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete menu item?"
        message={
          deleting && (
            <>
              <strong>{deleting.name}</strong> will be removed from the menu. This can&apos;t be undone.
            </>
          )
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />

      {toastEl}
    </>
  )

  return {
    openAdd,
    openEdit: setEditing,
    askDelete: setDeleting,
    toggleAvailability,
    showToast,
    elements,
  }
}
