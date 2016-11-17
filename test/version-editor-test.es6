import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import {detachNode} from 'widjet-utils'
import {click, mousedown, mousemove, mouseup} from 'widjet-test-utils/events'
import {getTestRoot, getBox, fakeBoundingClientRects} from 'widjet-test-utils/dom'
import {waitsFor} from 'widjet-test-utils/async'

import Version from '../src/version'
import VersionEditor, {editVersion} from '../src/version-editor'

import {withFakeContext, getImage} from './helpers'

describe('editVersion()', () => {
  jsdom()
  withFakeContext()
  fakeBoundingClientRects(computeBounds)

  let img, version, promise

  beforeEach(() => {
    img = getImage(900, 600, 600, 400)
    version = new Version('dummy', [200, 200])
    promise = editVersion(img, version)

    return waitsFor(() => document.body.querySelector('.version-editor'))
  })

  afterEach(() => {
    detachNode(document.body.querySelector('.version-editor'))
  })

  it('appends an editor to the DOM', () => {
    expect(document.body.querySelector('.version-editor')).not.to.be(null)
  })

  describe('clicking on save', () => {
    beforeEach(() => {
      click(document.body.querySelector('.save'))
    })

    it('resolves the promise with the version box', () => {
      return promise.then((box) => {
        expect(box).to.eql([150, 0, 600, 600])
      })
    })

    it('removes the editor from the DOM', () => {
      return promise.then((box) => {
        expect(document.body.querySelector('.version-editor')).to.be(null)
      })
    })
  })

  describe('clicking on cancel', () => {
    beforeEach(() => {
      click(document.body.querySelector('.cancel'))
    })

    it('rejects the promise', (done) => {
      promise.catch(done)
    })

    it('removes the editor from the DOM', (done) => {
      promise.catch(() => {
        expect(document.body.querySelector('.version-editor')).to.be(null)
        done()
      })
    })
  })
})

describe('VersionEditor', () => {
  jsdom()
  withFakeContext()
  fakeBoundingClientRects(computeBounds)

  let img, version, editor

  beforeEach(() => {
    img = getImage(900, 600, 600, 400)
    version = new Version('dummy', [200, 200])
    editor = new VersionEditor(img, version)

    editor.element.style.position = 'fixed'
    document.documentElement.scrollTop = 0
    document.documentElement.scrollLeft = 0
    document.body.scrollTop = 0
    document.body.scrollLeft = 0

    getTestRoot().appendChild(editor.element)
    editor.init()
  })

  afterEach(() => { editor.dispose() })

  it('clones the source image and places it in the editor', () => {
    expect(editor.element.querySelector('img')).not.to.be(null)
  })

  it('appends a div figuring the crop box', () => {
    const box = editor.element.querySelector('.version-box')
    expect(box.getBoundingClientRect()).to.eql(getBox(100, 0, 400, 400))
  })

  describe('#getVersionBox()', () => {
    it('returns the version box corresponding to the preview', () => {
      expect(editor.getVersionBox()).to.eql([150, 0, 600, 600])
    })
  })

  describe('#onSave', () => {
    it('is called whenever the save button is clicked', () => {
      editor.onSave = sinon.spy()

      click(editor.element.querySelector('.save'))

      expect(editor.onSave.called).to.be.ok()
    })
  })

  describe('#onCancel', () => {
    it('is called whenever the save button is clicked', () => {
      editor.onCancel = sinon.spy()

      click(editor.element.querySelector('.cancel'))

      expect(editor.onCancel.called).to.be.ok()
    })
  })

  describe('dragging the box', () => {
    let handle
    beforeEach(() => {
      handle = editor.element.querySelector('.drag-box')

      mousedown(handle, {x: 200, y: 200})
    })

    afterEach(() => {
      mouseup(handle)
    })

    it('moves the drag box inside the image bounds', () => {
      const box = editor.element.querySelector('.version-box')

      mousemove(handle, {x: 300, y: 300})
      expect(box.getBoundingClientRect()).to.eql(getBox(200, 0, 400, 400))

      mousemove(handle, {x: -300, y: -100})
      expect(box.getBoundingClientRect()).to.eql(getBox(0, 0, 400, 400))
    })
  })

  describe('dragging the top left handle', () => {
    let handle
    beforeEach(() => {
      handle = editor.element.querySelector('.top-left-handle')

      mousedown(handle, {x: 100, y: 0})
    })

    afterEach(() => {
      mouseup(handle)
    })

    it('resizes the box conserving the initial ratio', () => {
      const box = editor.element.querySelector('.version-box')

      mousemove(handle, {x: 150, y: 20})
      expect(box.getBoundingClientRect()).to.eql(getBox(150, 50, 350, 350))

      mousemove(handle, {x: 50, y: 20})
      expect(box.getBoundingClientRect()).to.eql(getBox(100, 0, 400, 400))
    })

    describe('when the image has a portrait orientation', () => {
      let otherHandle

      beforeEach(() => {
        img = getImage(600, 900, 400, 600)
        version = new Version('dummy', [200, 200])
        editor = new VersionEditor(img, version)

        getTestRoot().appendChild(editor.element)
        editor.init()

        otherHandle = editor.element.querySelector('.top-left-handle')

        mousedown(otherHandle, {x: 0, y: 100})
      })

      afterEach(() => {
        mouseup(otherHandle)
      })

      it('locks the width of the version box', () => {
        const box = editor.element.querySelector('.version-box')

        mousemove(otherHandle, {x: -100, y: 120})
        expect(box.getBoundingClientRect()).to.eql(getBox(0, 100, 400, 400))
      })
    })
  })

  describe('dragging the top right handle', () => {
    let handle
    beforeEach(() => {
      handle = editor.element.querySelector('.top-right-handle')

      mousedown(handle, {x: 500, y: 0})
    })

    afterEach(() => {
      mouseup(handle)
    })

    it('resizes the box conserving the initial ratio', () => {
      const box = editor.element.querySelector('.version-box')

      mousemove(handle, {x: 450, y: 20})
      expect(box.getBoundingClientRect()).to.eql(getBox(100, 50, 350, 350))

      mousemove(handle, {x: 550, y: 20})
      expect(box.getBoundingClientRect()).to.eql(getBox(100, 0, 400, 400))
    })

    describe('when the image has a portrait orientation', () => {
      let otherHandle

      beforeEach(() => {
        img = getImage(600, 900, 400, 600)
        version = new Version('dummy', [200, 200])
        editor = new VersionEditor(img, version)

        getTestRoot().appendChild(editor.element)
        editor.init()

        otherHandle = editor.element.querySelector('.top-right-handle')

        mousedown(otherHandle, {x: 400, y: 100})
      })

      afterEach(() => {
        mouseup(otherHandle)
      })

      it('locks the width of the version box', () => {
        const box = editor.element.querySelector('.version-box')

        mousemove(otherHandle, {x: 500, y: 120})
        expect(box.getBoundingClientRect()).to.eql(getBox(0, 100, 400, 400))
      })
    })
  })

  describe('dragging the bottom left handle', () => {
    let handle
    beforeEach(() => {
      handle = editor.element.querySelector('.bottom-left-handle')

      mousedown(handle, {x: 100, y: 400})
    })

    afterEach(() => {
      mouseup(handle)
    })

    it('resizes the box conserving the initial ratio', () => {
      const box = editor.element.querySelector('.version-box')

      mousemove(handle, {x: 150, y: 380})
      expect(box.getBoundingClientRect()).to.eql(getBox(150, 0, 350, 350))

      mousemove(handle, {x: 50, y: 380})
      expect(box.getBoundingClientRect()).to.eql(getBox(100, 0, 400, 400))
    })

    describe('when the image has a portrait orientation', () => {
      let otherHandle

      beforeEach(() => {
        img = getImage(600, 900, 400, 600)
        version = new Version('dummy', [200, 200])
        editor = new VersionEditor(img, version)

        getTestRoot().appendChild(editor.element)
        editor.init()

        otherHandle = editor.element.querySelector('.bottom-left-handle')

        mousedown(otherHandle, {x: 0, y: 500})
      })

      afterEach(() => {
        mouseup(otherHandle)
      })

      it('locks the width of the version box', () => {
        const box = editor.element.querySelector('.version-box')

        mousemove(otherHandle, {x: -100, y: 380})
        expect(box.getBoundingClientRect()).to.eql(getBox(0, 100, 400, 400))
      })
    })
  })

  describe('dragging the bottom right handle', () => {
    let handle
    beforeEach(() => {
      handle = editor.element.querySelector('.bottom-right-handle')

      mousedown(handle, {x: 500, y: 400})
    })

    afterEach(() => {
      mouseup(handle)
    })

    it('resizes the box conserving the initial ratio', () => {
      const box = editor.element.querySelector('.version-box')

      mousemove(handle, {x: 450, y: 380})
      expect(box.getBoundingClientRect()).to.eql(getBox(100, 0, 350, 350))

      mousemove(handle, {x: 550, y: 380})
      expect(box.getBoundingClientRect()).to.eql(getBox(100, 0, 400, 400))
    })

    describe('when the image has a portrait orientation', () => {
      let otherHandle

      beforeEach(() => {
        img = getImage(600, 900, 400, 600)
        version = new Version('dummy', [200, 200])
        editor = new VersionEditor(img, version)

        getTestRoot().appendChild(editor.element)
        editor.init()

        otherHandle = editor.element.querySelector('.bottom-right-handle')

        mousedown(otherHandle, {x: 400, y: 500})
      })

      afterEach(() => {
        mouseup(otherHandle)
      })

      it('locks the width of the version box', () => {
        const box = editor.element.querySelector('.version-box')

        mousemove(otherHandle, {x: 550, y: 380})
        expect(box.getBoundingClientRect()).to.eql(getBox(0, 100, 400, 400))
      })
    })
  })

  describe('pressing and dragging on the background image', () => {
    let clone
    beforeEach(() => {
      clone = editor.element.querySelector('img')

      mousedown(clone, {x: 50, y: 50})
    })

    afterEach(() => {
      mouseup(clone)
    })

    it('defines new coordinates for the box', () => {
      const box = editor.element.querySelector('.version-box')

      mousemove(clone, {x: 250, y: 100})
      expect(box.getBoundingClientRect()).to.eql(getBox(50, 50, 200, 200))

      mousemove(clone, {x: 800, y: 100})
      expect(box.getBoundingClientRect()).to.eql(getBox(50, 50, 350, 350))

      mousemove(clone, {x: 20, y: 30})
      expect(box.getBoundingClientRect()).to.eql(getBox(20, 20, 30, 30))
    })
  })
})

function computeBounds () {
  if (this.nodeName === 'IMG') {
    return getBox(0, 0, this.width, this.height)
  } else if (this.classList.contains('version-box')) {
    const top = parseInt(this.style.top, 10)
    const left = parseInt(this.style.left, 10)
    const width = parseInt(this.style.width, 10)
    const height = parseInt(this.style.height, 10)

    return getBox(left, top, width, height)
  } else if (this.classList.contains('drag-box')) {
    return this.parentNode.getBoundingClientRect()
  } else if (this.classList.contains('version-preview')) {
    return this.querySelector('img').getBoundingClientRect()
  } else if (this.classList.contains('top-left-handle')) {
    const {top, left} = this.parentNode.getBoundingClientRect()
    return getBox(left - 2, top - 2, 4, 4)
  } else if (this.classList.contains('top-right-handle')) {
    const {top, right} = this.parentNode.getBoundingClientRect()
    return getBox(right - 2, top - 2, 4, 4)
  } else if (this.classList.contains('bottom-left-handle')) {
    const {bottom, left} = this.parentNode.getBoundingClientRect()
    return getBox(left - 2, bottom - 2, 4, 4)
  } else if (this.classList.contains('bottom-right-handle')) {
    const {bottom, right} = this.parentNode.getBoundingClientRect()
    return getBox(right - 2, bottom - 2, 4, 4)
  } else {
    return getBox(0, 0, 50, 50)
  }
}
