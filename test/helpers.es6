import sinon from 'sinon'
import {asArray} from 'widjet-utils'
import {createEvent} from 'widjet-test-utils/events'
import {getTestRoot} from 'widjet-test-utils/dom'

export function getFile (name, type) {
  return new window.File(['foo'], name, {type, lastModified: new Date()})
}

export function pickFile (input, file, changeEvent = true) {
  Object.defineProperty(input, 'files', {
    get: () => file ? [file] : [],
    configurable: true
  })
  if (changeEvent) { change(input) }
}

export function change (target) {
  target.dispatchEvent(createEvent('Event', 'change'))
}

export function triggerImageLoad (cb) {
  if (typeof process !== 'undefined') {
    let listener
    beforeEach(() => {
      listener = () => {
        asArray(getTestRoot().querySelectorAll('img'))
        .forEach(img => img.onload && img.onload())
      }
      getTestRoot().addEventListener('preview:ready', listener)
    })

    afterEach(() => {
      getTestRoot().removeEventListener('preview:ready', listener)
    })
  }
}

export function withFakeContext () {
  let safGetContext
  beforeEach(() => {
    const FakeContext = {drawImage: sinon.spy()}

    safGetContext = window.HTMLCanvasElement.prototype.getContext
    window.HTMLCanvasElement.prototype.getContext = () => FakeContext
  })

  afterEach(() => {
    window.HTMLCanvasElement.prototype.getContext = safGetContext
  })
}
