import {createEvent} from 'widjet-test-utils/events'

export function getFile (name, type) {
  return new window.File(['foo'], name, {type, lastModified: new Date()})
}

export function pickFile (input, file) {
  Object.defineProperty(input, 'files', {
    get: () => [file],
    configurable: true
  })
  change(input)
}

export function change (target) {
  target.dispatchEvent(createEvent('Event', 'change'))
}
