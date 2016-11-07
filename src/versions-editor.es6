import widgets from 'widjet'
import {parent} from 'widjet-utils'

widgets.define('versions-editor', (options) => (input) => {
  const container = parent(input, '.file-input')
  const versionsContainer = document.createElement('div')
  const versions = JSON.parse(input.getAttribute('data-versions'))
  versionsContainer.classList.add('versions')

  container.appendChild(versionsContainer)

  input.addEventListener('preview:ready', () => {
    for (let version in versions) {
      const div = document.createElement('div')
      div.classList.add('version')
      div.textContent = version
      versionsContainer.appendChild(div)
    }
  })
})
