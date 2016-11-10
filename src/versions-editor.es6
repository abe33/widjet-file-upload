import widgets from 'widjet'
import {parent} from 'widjet-utils'
import Version from './version'

widgets.define('versions-editor', (options) => (input, widget) => {
  const container = parent(input, '.file-input')
  const versionsContainer = document.createElement('div')
  const versionsData = JSON.parse(input.getAttribute('data-versions'))
  const versionBoxesData = JSON.parse(input.getAttribute('data-version-boxes') || '{}')
  const versions = {}
  versionsContainer.classList.add('versions')

  widget.versions = versions

  for (let versionName in versionsData) {
    versions[versionName] = new Version(versionName, versionsData[versionName])
    if (versionBoxesData[versionName]) {
      versions[versionName].setBox(versionBoxesData[versionName])
    }
  }

  container.appendChild(versionsContainer)

  input.addEventListener('preview:loaded', () => {
    const img = container.querySelector('img')
    versionsContainer.innerHTML = ''
    for (let versionName in versions) {
      const version = versions[versionName]
      version.setBox()
      const canvas = version.getVersion(img)
      const div = document.createElement('div')
      div.classList.add('version')
      div.innerHTML = `
        <span class='version-name'>${versionName}</span>
        <span class='version-size'>${version.size.join('x')}</span>
      `
      div.insertBefore(canvas, div.firstChild)
      versionsContainer.appendChild(div)
    }
  })
})
