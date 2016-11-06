import widgets from 'widjet'
import {parent} from 'widjet-utils'

widgets.define('versions-editor', (options) => (input) => {
  const container = parent(input, '.file-input')
  const versionsContainer = document.createElement('div')
  versionsContainer.classList.add('versions')

  container.appendChild(versionsContainer)
})
