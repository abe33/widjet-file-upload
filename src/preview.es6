import {getNode, when, always} from 'widjet-utils'

const previewsByFileKeys = {}

export function fileKey (file) {
  return `${file.name}-${file.type}-${file.size}-${file.lastModified}`
}

const imageTypes = (...ts) => {
  const types = ts.map(t => `image/${t}`)
  return o => types.indexOf(o.file.type) > -1
}

export const DEFAULT_PREVIEWERS = [
  [
    imageTypes('jpeg', 'jpg', 'png', 'gif', 'bmp'),
    o => getImagePreview(o)
  ],
  [always, o => Promise.resolve()]
]

export const getPreview = when(DEFAULT_PREVIEWERS)

export function disposePreview (file) {
  delete previewsByFileKeys[fileKey(file)]
}

export function getImagePreview (o) {
  const key = fileKey(o.file)
  return previewsByFileKeys[key]
    ? previewsByFileKeys[key]
    : previewsByFileKeys[key] = createPreviewPromise(o)
}

export function createPreviewPromise ({file, onprogress}) {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader()
    reader.onload = (e) => resolve(getNode(`<img src="${e.target.result}">`))
    reader.onerror = (err) => reject(err)
    reader.onprogress = onprogress
    reader.readAsDataURL(file)
  })
}
