import widgets from 'widjet'
import {asArray, getNode, detachNode} from 'widjet-utils'

const filePreviews = {}
const filesById = {}

widgets.define('file-upload', (options) => {
  return (input) => {

  }
})

widgets.define('local-file-upload', (options) => (el) => {
  const {id} = el

  const expectedSize = el.hasAttribute('data-size')
    ? el.getAttribute('data-size').split(',').map(s => `${s}px`)
    : ['auto', 'auto']

  const wrapper = el.parentNode.parentNode
  const previewContainer = wrapper.querySelector('.preview')
  const metaContainer = wrapper.querySelector('.meta')
  const size = metaContainer.querySelector('.size')
  const dimensions = metaContainer.querySelector('.dimensions')
  const name = metaContainer.querySelector('.name')
  const mime = metaContainer.querySelector('.mime')
  const input = wrapper.querySelector('input[data-name]')

  el.setAttribute('data-name', input.getAttribute('data-name'))
  input.removeAttribute('data-name')

  el.addEventListener('change', (e) => {
    const previousImage = previewContainer.querySelector('img')
    if (previousImage) { detachNode(previousImage) }

    if (filesById[id]) {
      filesById[id].forEach((file) => delete filePreviews[fileKey(file)])
      delete filesById[id]
    }

    const files = asArray(el.files)
    const file = files[0]
    const reader = new window.FileReader()
    reader.onload = (e) => {
      const {result} = e.target

      filePreviews[fileKey(file)] = result

      const pendingImages = findPendingImg(fileKey(file))
      pendingImages.forEach((node) => {
        node.parentNode.insertBefore(getNode(getImg(result, expectedSize)), node)
        detachNode(node)
      })

      const previewImage = getNode(getImg(result))
      previewImage.onload = (e) => {
        dimensions.textContent = `${previewImage.width}x${previewImage.height}px`
      }
      previewContainer.appendChild(previewImage)
      size.textContent = `${Math.round(file.size / 1024 * 100) / 100}ko`
      name.textContent = file.name
      mime.textContent = file.type
    }
    reader.readAsDataURL(file)

    filesById[id] = files
  })
})

function replaceTokens (string, tokens) {
  return string.replace(/:(\w+)/g, (m, k) => tokens[k])
}

function getMissingImg (size = ['auto', 'auto']) {
  return `<div style="display:block;border:none;width:100%;height:${size[1]};" class="img-placeholder" border="0"><div style="font-size:${size[1] !== 'auto' ? (parseInt(size[1], 10) / 4) + 'px' : '3em'};">${size.map(s => s.replace('px', '')).join('x')}</div></div>`
}

function getImg (data, size = ['auto', 'auto']) {
  return `<img style="display:block;border:none;width:${size[0]};height:auto;" class="img1" src="${data}" border="0">`
}

function getPendingImg (key, size = ['auto', 'auto']) {
  return `<div class="pending-image" data-img="${key}" style="width:100%;height:${size[1]};"><i class="fa fa-circle-o-notch fa-spin fa-3x"></i></div>`
}

function findPendingImg (key) {
  return asArray(document.querySelector('iframe').contentDocument.querySelectorAll(`[data-img="${key}"]`))
}
