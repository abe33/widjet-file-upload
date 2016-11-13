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
      mousemove(handle, {x: 300, y: 300})
      mouseup(handle, {x: 300, y: 300})
    })

    it('moves the drag box inside the image bounds', () => {
      const box = editor.element.querySelector('.version-box')
      expect(box.getBoundingClientRect()).to.eql({
        top: 0,
        left: 200,
        bottom: 400,
        right: 600,
        width: 400,
        height: 400
      })
    })
  })
})
