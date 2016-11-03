import widgets from 'widjet'
import {getNode, detachNode, when, merge} from 'widjet-utils'
import {previewBuilder, disposePreview, getImagePreview, getTextPreview, resetPreviewCache} from './preview'

export {getImagePreview, getTextPreview, previewBuilder, disposePreview, resetPreviewCache}

widgets.define('file-upload', (options) => {
  const {
    wrap, previewSelector, nameMetaSelector, mimeMetaSelector, dimensionsMetaSelector, sizeMetaSelector, formatSize, formatDimensions
  } = merge(defaults, options)

  const getPreview = previewBuilder(options.previewers)

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
        writeText(dimensions, '')
        filesById[input.id] = file
      })
    })
  }
})

const filesById = {}

const writeText = (node, value) => node && (node.textContent = value)

const unitPerSize = ['B', 'kB', 'MB', 'GB', 'TB'].map((u, i) => [Math.pow(1024, i + 1), u])

const round = n => (n * 100) / 100

const defaults = {
  previewSelector: '.preview',
  nameMetaSelector: '.meta .name',
  mimeMetaSelector: '.meta .mime',
  dimensionsMetaSelector: '.meta .dimensions',
  sizeMetaSelector: '.meta .size',
  formatSize: when(unitPerSize.map(([limit, unit]) =>
    [n => n < limit, n => [round(n), unit].join('')])
  ),
  formatDimensions: (image) => `${image.width}x${image.height}px`,
  wrap: (input) => {
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
          <div class="size"></div>
          <div class="dimensions"></div>
        </div>
      </div>
    `)
    wrapper.querySelector('label').appendChild(input)
    return wrapper
  }
}
