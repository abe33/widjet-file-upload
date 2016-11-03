import widgets from 'widjet'
import {getNode, detachNode, when} from 'widjet-utils'
import {previewBuilder, disposePreview, getImagePreview, getTextPreview, resetPreviewCache} from './preview'

const filesById = {}

export {getImagePreview, getTextPreview, previewBuilder, disposePreview, resetPreviewCache}

widgets.define('file-upload', (options) => {
  const wrap = options.wrap || defaultWrap
  const previewSelector = options.previewSelector || '.preview'
  const nameMetaSelector = options.nameMetaSelector || '.meta .name'
  const mimeMetaSelector = options.mimeMetaSelector || '.meta .mime'
  const dimensionsMetaSelector = options.dimensionsMetaSelector || '.meta .dimensions'
  const sizeMetaSelector = options.sizeMetaSelector || '.meta .size'
  const formatSize = options.formatSize || defaultFormatSize
  const formatDimensions = options.formatDimensions || defaultFormatDimensions

  const getPreview = previewBuilder()

  return (input) => {
    const container = input.parentNode
    const wrapper = wrap(input)
    const nextSibling = input.nextElementSibling
    container.insertBefore(wrapper, nextSibling)

    const previewContainer = wrapper.querySelector(previewSelector)
    const size = wrapper.querySelector(sizeMetaSelector)
    const dimensions = wrapper.querySelector(dimensionsMetaSelector)
    const name = wrapper.querySelector(nameMetaSelector)
    const mime = wrapper.querySelector(mimeMetaSelector)

    input.addEventListener('change', (e) => {
      const previousImage = previewContainer.querySelector('img')
      if (previousImage) { detachNode(previousImage) }

      if (filesById[input.id]) {
        disposePreview(filesById[input.id])
        delete filesById[input.id]
      }

      const file = input.files[0]

      file && getPreview({file}).then((preview) => {
        preview.onload = () => writeText(dimensions, formatDimensions(preview))
        previewContainer.appendChild(preview)
        writeText(size, formatSize(file.size))
        writeText(name, file.name)
        writeText(mime, file.type)
        filesById[input.id] = file
      })
    })
  }
})

const defaultWrap = (input) => {
  const wrapper = getNode(`
    <div class="image-input">
      <div class='image-container'>
        <label></label>

        <div class="preview"></div>
      </div>

      <progress value="0" min="0" max="100">0%</progress>

      <div class="meta">
        <div class="name"></div>
        <div class="mime"></div>
        <div class="dimensions"></div>
        <div class="size"></div>
      </div>
    </div>
  `)
  wrapper.querySelector('label').appendChild(input)
  return wrapper
}

const writeText = (node, value) => node && (node.textContent = value)

const defaultFormatDimensions = (image) => `${image.width}x${image.height}px`

const unitPerSize = ['B', 'kB', 'MB', 'GB', 'TB'].map((u, i) => [Math.pow(1024, i + 1), u])

const round = n => (n * 100) / 100

const defaultFormatSize = when(unitPerSize.map(([limit, unit]) =>
  [n => n < limit, n => [round(n), unit].join('')])
)
