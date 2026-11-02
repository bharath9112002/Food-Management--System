export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export function checkImageFile(file) {
  if (!file.type.startsWith('image/')) return 'Please choose an image file'
  if (file.size > MAX_UPLOAD_BYTES) return 'Image must be smaller than 5 MB'
  return ''
}

// Shrinks an uploaded image to a JPEG data URL small enough for localStorage.
// `square` center-crops first, for avatars.
export function resizeImage(file, { maxSide = 600, square = false, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const crop = square ? Math.min(img.width, img.height) : null
      const srcW = crop ?? img.width
      const srcH = crop ?? img.height
      const scale = Math.min(1, maxSide / Math.max(srcW, srcH))

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(srcW * scale)
      canvas.height = Math.round(srcH * scale)
      canvas
        .getContext('2d')
        .drawImage(img, (img.width - srcW) / 2, (img.height - srcH) / 2, srcW, srcH, 0, 0, canvas.width, canvas.height)

      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file could not be read as an image'))
    }
    img.src = url
  })
}
