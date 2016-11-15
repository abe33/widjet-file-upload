import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import {mousedown, mousemove, mouseup} from 'widjet-test-utils/events'
import {getTestRoot, getBox, fakeBoundingClientRects} from 'widjet-test-utils/dom'

import Version from '../src/version'
import VersionEditor from '../src/version-editor'

import {withFakeContext, getImage} from './helpers'

describe('VersionEditor', () => {
  jsdom()
  withFakeContext()
  fakeBoundingClientRects(function () {
    if (this.nodeName === 'IMG') {
      return getBox(0, 0, this.width, this.height)
    } else if (this.classList.contains('version-box')) {
      const top = parseInt(this.style.top, 10)
      const left = parseInt(this.style.left, 10)
      const width = parseInt(this.style.width, 10)
      const height = parseInt(this.style.height, 10)

      return getBox(top, left, width, height)
    } else if (this.classList.contains('drag-box')) {
      return this.parentNode.getBoundingClientRect()
    } else if (this.classList.contains('version-preview')) {
      return this.querySelector('img').getBoundingClientRect()
    } else if (this.classList.contains('top-left-handle')) {
      const {top, left} = this.parentNode.getBoundingClientRect()
      return getBox(top - 2, left - 2, 4, 4)
    } else if (this.classList.contains('top-right-handle')) {
      const {top, right} = this.parentNode.getBoundingClientRect()
      return getBox(top - 2, right - 2, 4, 4)
    } else if (this.classList.contains('bottom-left-handle')) {
      const {bottom, left} = this.parentNode.getBoundingClientRect()
      return getBox(bottom - 2, left - 2, 4, 4)
    } else if (this.classList.contains('bottom-right-handle')) {
      const {bottom, right} = this.parentNode.getBoundingClientRect()
      return getBox(bottom - 2, right - 2, 4, 4)
    }
  })

  let img, version, editor

  beforeEach(() => {
    img = getImage(900, 600, 600, 400)
    version = new Version('dummy', [200, 200])
    editor = new VersionEditor(img, version)

    getTestRoot().appendChild(editor.element)
  })

  it('clones the source image and places it in the editor', () => {
    expect(editor.element.querySelector('img')).not.to.be(null)
  })

  it('appends a div figuring the crop box', () => {
    const box = editor.element.querySelector('.version-box')
    expect(box.getBoundingClientRect()).to.eql({
      top: 0,
      left: 100,
      bottom: 400,
      right: 500,
      width: 400,
      height: 400
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
      expect(box.getBoundingClientRect()).to.eql({
        top: 0,
        left: 200,
        bottom: 400,
        right: 600,
        width: 400,
        height: 400
      })

      mousemove(handle, {x: -300, y: -100})
      expect(box.getBoundingClientRect()).to.eql({
        top: 0,
        left: 0,
        bottom: 400,
        right: 400,
        width: 400,
        height: 400
      })
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
      expect(box.getBoundingClientRect()).to.eql({
        top: 50,
        left: 150,
        bottom: 400,
        right: 500,
        width: 350,
        height: 350
      })

      mousemove(handle, {x: 50, y: 20})
      expect(box.getBoundingClientRect()).to.eql({
        top: 0,
        left: 100,
        bottom: 400,
        right: 500,
        width: 400,
        height: 400
      })
    })
  })

  describe('when the image has a portrait orientation', () => {
    let otherHandle

    beforeEach(() => {
      img = getImage(600, 900, 400, 600)
      version = new Version('dummy', [200, 200])
      editor = new VersionEditor(img, version)

      getTestRoot().appendChild(editor.element)

      otherHandle = editor.element.querySelector('.top-left-handle')

      mousedown(otherHandle, {x: 0, y: 100})
    })

    afterEach(() => {
      mouseup(otherHandle)
    })

    it('locks the width of the version box', () => {
      const box = editor.element.querySelector('.version-box')

      mousemove(otherHandle, {x: -100, y: 120})
      expect(box.getBoundingClientRect()).to.eql({
        top: 100,
        left: 0,
        bottom: 500,
        right: 400,
        width: 400,
        height: 400
      })
    })
  })
})
