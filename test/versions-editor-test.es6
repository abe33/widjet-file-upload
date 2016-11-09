import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import widgets from 'widjet'
import sinon from 'sinon'
import {waitsFor} from 'widjet-test-utils/async'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'

import '../src/index'

import {withFakeContext, pickFile, getFile} from './helpers'

describe('versions-editor', () => {
  jsdom()

  let wrapper, input, versionsContainer, spy
  withFakeContext()

  beforeEach(() => {
    const versions = {
      small: [240, 180],
      medium: [640, 480],
      wide: [640, 360]
    }

    setPageContent(`
      <input type="file"
             name="file"
             data-versions='${JSON.stringify(versions)}'>
    `)

    widgets('file-preview', 'input[type="file"]', {on: 'init'})
    widgets('versions-editor', 'input[type="file"][data-versions]', {
      on: 'init'
    })

    wrapper = getTestRoot().querySelector('.file-input')
    input = wrapper.querySelector('input[type="file"]')
    versionsContainer = wrapper.querySelector('.versions')
  })

  it('appends a versions container in the image input', () => {
    expect(versionsContainer).not.to.be(null)
  })

  describe('when an image is picked', () => {
    beforeEach(() => {
      spy = sinon.spy()
      input.addEventListener('preview:ready', spy)
      pickFile(input, getFile('foo.jpg', 'image/jpeg'))

      return waitsFor(() => spy.called)
    })

    it('appends a slot for each version defined on the input', () => {
      const versions = versionsContainer.querySelectorAll('.version')
      expect(versions).to.have.length(3)
    })

    it('appends a canvas corresponding to each version', () => {
      const versions = versionsContainer.querySelectorAll('canvas')
      expect(versions).to.have.length(3)
    })
  })
})
