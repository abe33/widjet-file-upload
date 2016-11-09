import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'

import Version from '../src/version'

describe('Version', () => {
  jsdom()

  let version, safGetContext, image, canvas, context

  beforeEach(() => {
    version = new Version('small', [200, 150])
    const FakeContext = {drawImage: sinon.spy()}

    canvas = document.createElement('canvas')
    safGetContext = window.HTMLCanvasElement.prototype.getContext
    window.HTMLCanvasElement.prototype.getContext = () => FakeContext
    image = document.createElement('img')
    Object.defineProperty(image, 'naturalWidth', { get: () => 800 })
    Object.defineProperty(image, 'naturalHeight', { get: () => 400 })
    image.width = 800
    image.height = 400
  })

  afterEach(() => {
    window.HTMLCanvasElement.prototype.getContext = safGetContext
  })

  describe('#getVersion()', () => {
    beforeEach(() => {
      canvas = version.getVersion(image)
      context = canvas.getContext('2d')
    })

    it('creates a canvas of the provided size', () => {
      expect(canvas.width).to.eql(200)
      expect(canvas.height).to.eql(150)
    })

    it('draws the image onto the canvas using the default position', () => {
      expect(context.drawImage.calledWith(image, 0, 250, 400, 300)).to.be.ok()
    })
  })
})
