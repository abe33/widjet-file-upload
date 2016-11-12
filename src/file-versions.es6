import widgets from 'widjet'
import {parent, getNode} from 'widjet-utils'
import Version from './version'

widgets.define('file-versions', (options) => {
  const getVersion = options.getVersion || ((img, version) => {
    const canvas = version.getVersion(img)
    const div = getNode(`
      <div class="version">
        <button type="button" tabindex="-1"><span>Edit</span></button>
        <div class="version-meta">
          <span class="version-name">${version.name}</span>
          <span class="version-size">${version.size.join('x')}</span>
        </div>
      </div>
    `)
    div.appendChild(canvas, div.firstChild)
    return div
  })
  return (input, widget) => {
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
      versionsContainer.innerHTML = ''
      const img = container.querySelector('img')

      if (img) {
        for (let versionName in versions) {
          const version = versions[versionName]
          version.setBox()
          const div = getVersion(img, version)
          versionsContainer.appendChild(div)
        }
      }
    })
  }
})
