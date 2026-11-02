import { useState } from 'react'
import { CATEGORIES } from '../../api/menu'
import { FormField } from '../FormField'
import { checkImageFile, resizeImage } from '../../utils/image'
import { FALLBACK_IMAGE, handleImageError } from './image'

const EMPTY = {
  name: '',
  description: '',
  price: '',
  category: '',
  isVeg: true,
  available: true,
  image: '',
}


function validate(v) {
  const errors = {}
  const price = Number(v.price)

  if (!v.name.trim()) errors.name = 'Food name is required'
  else if (v.name.trim().length < 3) errors.name = 'Name must be at least 3 characters'
  else if (v.name.trim().length > 60) errors.name = 'Name must be 60 characters or fewer'

  if (!v.description.trim()) errors.description = 'Description is required'
  else if (v.description.trim().length < 10) errors.description = 'Description must be at least 10 characters'
  else if (v.description.trim().length > 200) errors.description = 'Description must be 200 characters or fewer'

  if (v.price === '') errors.price = 'Price is required'
  else if (!Number.isFinite(price) || price <= 0) errors.price = 'Enter a price greater than 0'
  else if (price > 10000) errors.price = 'Price cannot exceed ₹10,000'

  if (!v.category) errors.category = 'Select a category'

  if (v.image && !v.image.startsWith('data:image/') && !/^https?:\/\/\S+$/.test(v.image)) {
    errors.image = 'Enter a valid image URL starting with http(s)://'
  }
  return errors
}

export default function MenuItemForm({ initial, onSubmit, onCancel }) {
  const [values, setValues] = useState(() =>
    initial ? { ...EMPTY, ...initial, price: String(initial.price) } : EMPTY,
  )
  const [touched, setTouched] = useState({})
  const [uploadError, setUploadError] = useState('')

  const errors = validate(values)
  const show = (field) => (touched[field] ? errors[field] : '')
  const set = (field, value) => setValues((v) => ({ ...v, [field]: value }))
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  async function handleFile(e) {
    const file = e.target.files[0]
    e.target.value = ''
    setUploadError('')
    if (!file) return
    const problem = checkImageFile(file)
    if (problem) return setUploadError(problem)
    try {
      set('image', await resizeImage(file))
    } catch (err) {
      setUploadError(err.message)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])))
    if (Object.keys(errors).length) return

    onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
      price: Math.round(Number(values.price)),
      image: values.image.trim(),
    })
  }

  const isUpload = values.image.startsWith('data:')

  return (
    <form className="menu-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="form-col">
          <FormField
            label="Food name"
            id="name"
            placeholder="e.g. Paneer Tikka"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={blur}
            error={show('name')}
          />

          <div className="field">
            <label htmlFor="description">Description</label>
            <div className={`input-wrap${show('description') ? ' invalid' : ''}`}>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="What makes this dish special?"
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                onBlur={blur}
                aria-invalid={Boolean(show('description'))}
              />
            </div>
            <div className="field-hint">
              {show('description') ? (
                <p className="field-error" role="alert">{errors.description}</p>
              ) : (
                <span />
              )}
              <small>{values.description.trim().length}/200</small>
            </div>
          </div>

          <div className="form-row-2">
            <FormField
              label="Price (₹)"
              id="price"
              type="number"
              inputMode="decimal"
              min="1"
              placeholder="249"
              value={values.price}
              onChange={(e) => set('price', e.target.value)}
              onBlur={blur}
              error={show('price')}
            />

            <div className="field">
              <label htmlFor="category">Category</label>
              <div className={`input-wrap${show('category') ? ' invalid' : ''}`}>
                <select
                  id="category"
                  name="category"
                  value={values.category}
                  onChange={(e) => set('category', e.target.value)}
                  onBlur={blur}
                  aria-invalid={Boolean(show('category'))}
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {show('category') && <p className="field-error" role="alert">{errors.category}</p>}
            </div>
          </div>

          <fieldset className="field choice-group">
            <legend>Food type</legend>
            {[
              { value: true, label: 'Veg', cls: 'veg' },
              { value: false, label: 'Non-veg', cls: 'nonveg' },
            ].map((opt) => (
              <label key={opt.label} className={`choice ${values.isVeg === opt.value ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="isVeg"
                  checked={values.isVeg === opt.value}
                  onChange={() => set('isVeg', opt.value)}
                />
                <span className={`veg-mark ${opt.cls}`} aria-hidden="true">
                  <span className="veg-symbol" />
                </span>
                {opt.label}
              </label>
            ))}
          </fieldset>

          <label className="toggle">
            <input
              type="checkbox"
              checked={values.available}
              onChange={(e) => set('available', e.target.checked)}
            />
            <span className="toggle-track" aria-hidden="true" />
            {values.available ? 'Available for ordering' : 'Currently unavailable'}
          </label>
        </div>

        <div className="form-col">
          <span className="field-label">Food image</span>
          <div className="image-preview">
            <img src={values.image || FALLBACK_IMAGE} alt="Preview" onError={handleImageError} />
          </div>

          <label className="btn-secondary upload-btn">
            📷 Upload image
            <input type="file" accept="image/*" onChange={handleFile} />
          </label>
          {uploadError && <p className="field-error" role="alert">{uploadError}</p>}

          <FormField
            label="…or paste an image URL"
            id="image"
            type="url"
            placeholder="https://…"
            value={isUpload ? '' : values.image}
            onChange={(e) => set('image', e.target.value)}
            onBlur={blur}
            error={show('image')}
            disabled={isUpload}
          />
          {isUpload && (
            <button type="button" className="link-btn" onClick={() => set('image', '')}>
              Remove uploaded image
            </button>
          )}
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary btn-inline">
          {initial ? 'Save changes' : 'Add menu item'}
        </button>
      </div>
    </form>
  )
}
