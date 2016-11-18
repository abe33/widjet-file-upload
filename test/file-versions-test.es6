import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import widgets from 'widjet'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'
import {waitsFor} from 'widjet-test-utils/async'
import {click} from 'widjet-test-utils/events'

import '../src/index'

import {triggerImageLoad, withFakeContext, pickFile, getFile} from './helpers'

const versionsProvider = (el) =>
  el.hasAttribute('data-versions')
    ? JSON.parse(el.getAttribute('data-versions'))
    : {}

const versionBoxesProvider = (el) =>
  el.hasAttribute('data-version-boxes')
    ? JSON.parse(el.getAttribute('data-version-boxes'))
    : {}

describe('file-versions', () => {
  jsdom()
  withFakeContext()
  triggerImageLoad()

  let wrapper, input, versionsContainer, loadedSpy
  let versionSpy = sinon.spy()

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
    widgets('file-versions', 'input[type="file"][data-versions]', {
      on: 'init',
      versionsProvider,
      versionBoxesProvider,
      onVersionsChange: versionSpy
    })

    spyOnLoad()

    wrapper = getTestRoot().querySelector('.file-input')
    input = wrapper.querySelector('input[type="file"]')
    versionsContainer = wrapper.querySelector('.versions')
  })

  afterEach(() => {
    widgets.release('file-versions', 'file-preview')
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

    describe('clicking on the edit button', () => {
      beforeEach(() => {
        click(versionsContainer.querySelector('.version button'))
        return waitsFor(() => document.body.querySelector('.version-editor'))
      })

      it('appends an editor to the DOM', () => {
        expect(document.body.querySelector('.version-editor')).not.to.be(null)
      })

      describe('clicking on the editor save button', () => {
        beforeEach(() => {
          click(document.body.querySelector('.version-editor .save'))
        })

        it('removes the editor from the DOM', () => {
          expect(document.body.querySelector('.version-editor')).to.be(null)
        })

        it('calls the onVersionsChange callback', () => {
          expect(versionSpy.called).to.be.ok()
        })
      })
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

      describe('to a file that is not an image', () => {
        beforeEach(() => {
          const file = getFile('foo.pdf', 'application/pdf')
          pickFile(input, file)

          spyOnLoad()

          return waitsFor('preview loaded', () => loadedSpy.called)
        })

        it('removes the previous versions', () => {
          const versions = versionsContainer.querySelectorAll('canvas')
          expect(versions).to.have.length(0)
        })
      })
    })
  })

  describe('when the input has a data-version-boxes attributes', () => {
    beforeEach(() => {
      const versions = {
        small: [240, 180],
        medium: [640, 480],
        wide: [640, 360]
      }

      const versionBoxes = {
        small: [100, 100, 480, 260],
        medium: [20, 30, 320, 240],
        wide: [50, 50, 1280, 720]
      }

      setPageContent(`
        <input type="file"
               name="file"
               data-versions='${JSON.stringify(versions)}'
               data-version-boxes='${JSON.stringify(versionBoxes)}'>
      `)

      widgets('file-preview', 'input[type="file"]', {on: 'init'})
      widgets('file-versions', 'input[type="file"][data-versions]', {
        on: 'init',
        versionsProvider,
        versionBoxesProvider
      })

      spyOnLoad()

      wrapper = getTestRoot().querySelector('.file-input')
      input = wrapper.querySelector('input[type="file"]')
      versionsContainer = wrapper.querySelector('.versions')
    })

    it('registers the passed-in box with the corresponding version', () => {
      const widget = widgets.widgetsFor(input, 'file-versions')
      expect(widget.versions.small.box).to.eql([100, 100, 480, 260])
      expect(widget.versions.medium.box).to.eql([20, 30, 320, 240])
      expect(widget.versions.wide.box).to.eql([50, 50, 1280, 720])
    })

    describe('then picking a file', () => {
      beforeEach(() => {
        const file = getFile('bar.jpg', 'image/jpeg')
        pickFile(input, file)

        spyOnLoad()

        return waitsFor('preview loaded', () => loadedSpy.called)
      })

      it('removes the previous version boxes', () => {
        const widget = widgets.widgetsFor(input, 'file-versions')
        expect(widget.versions.small.box).to.be(undefined)
        expect(widget.versions.medium.box).to.be(undefined)
        expect(widget.versions.wide.box).to.be(undefined)
      })
    })
  })
})
