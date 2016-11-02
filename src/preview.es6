import {getNode} from 'widjet-utils'

const previewsByFileKeys = {}

export function fileKey (file) {
  return `${file.name}-${file.type}-${file.size}-${file.lastModified}`
}

export function disposePreview (file) {
  delete previewsByFileKeys[fileKey(file)]
}

export function getPreview (file, onprogress) {
  switch (file.type) {
    case 'image/jpeg':
    case 'image/jpg':
    case 'image/png':
    case 'image/gif':
    case 'image/bmp':
      return getImagePreview(file, onprogress)
    default:
      return Promise.resolve()

  }
}
export function getImagePreview (file, onprogress) {
  const key = fileKey(file)
  return previewsByFileKeys[key]
    ? previewsByFileKeys[key]
    : previewsByFileKeys[key] = createPreviewPromise(file, onprogress)
}

export function createPreviewPromise (file, onprogress) {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader()
    reader.onload = (e) => resolve(getNode(`<img src="${e.target.result}">`))
    reader.onerror = (err) => reject(err)
    reader.onprogress = onprogress
    reader.readAsDataURL(file)
  })
}
