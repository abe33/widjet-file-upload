import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import widgets from 'widjet'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'
import {waitsFor} from 'widjet-test-utils/async'

import '../src/index'

import {triggerImageLoad, withFakeContext, pickFile, getFile} from './helpers'

describe('versions-editor', () => {
  jsdom()
  withFakeContext()
  triggerImageLoad()

  let wrapper, input, versionsContainer, loadedSpy

  const spyOnLoad = () => {
    loadedSpy = sinon.spy()
    getTestRoot().addEventListener('preview:loaded', loadedSpy)
  }

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

    spyOnLoad()

    wrapper = getTestRoot().querySelector('.file-input')
    input = wrapper.querySelector('input[type="file"]')
    versionsContainer = wrapper.querySelector('.versions')
  })

  it('appends a versions container in the image input', () => {
    expect(versionsContainer).not.to.be(null)
  })

  describe('when an image is picked', () => {
    beforeEach(() => {
      const file = getFile('foo.jpg', 'image/jpeg')
      pickFile(input, file)

      return waitsFor('preview loaded', () => loadedSpy.called)
    })

    it('appends a slot for each version defined on the input', () => {
      const versions = versionsContainer.querySelectorAll('.version')
      expect(versions).to.have.length(3)
    })

    it('appends a canvas corresponding to each version', () => {
      const versions = versionsContainer.querySelectorAll('canvas')
      expect(versions).to.have.length(3)
    })

    describe('then changed', () => {
      beforeEach(() => {
        const file = getFile('bar.jpg', 'image/jpeg')
        pickFile(input, file)

        spyOnLoad()

        return waitsFor('preview loaded', () => loadedSpy.called)
      })

      it('removes the previous versions', () => {
        const versions = versionsContainer.querySelectorAll('canvas')
        expect(versions).to.have.length(3)
      })
    })
  })
})
