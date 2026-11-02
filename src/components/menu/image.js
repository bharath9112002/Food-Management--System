// Placeholder shown when a food item has no image or its URL fails to load.
export const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><rect width="400" height="260" fill="#f3f4f6"/><text x="200" y="145" font-size="64" text-anchor="middle">🍽️</text></svg>',
  )

export function handleImageError(e) {
  if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE
}
