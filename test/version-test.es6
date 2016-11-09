import expect from 'expect.js'
import jsdom from 'mocha-jsdom'

import Version from '../src/version'
import {withFakeContext} from './helpers'

const getImage = (width, height) => {
  const image = document.createElement('img')
  Object.defineProperty(image, 'naturalWidth', { get: () => width })
  Object.defineProperty(image, 'naturalHeight', { get: () => height })
  image.width = width
  image.height = height
  return image
}

describe('Version', () => {
  jsdom()

  let version, image, canvas, context

  withFakeContext()

  beforeEach(() => {
    version = new Version('small', [200, 150])
  })

  describe('#getVersion()', () => {
    describe('with no provided box', () => {
      describe('for an image in portrait orientation', () => {
        beforeEach(() => {
          image = getImage(400, 800)
          canvas = version.getVersion(image)
          context = canvas.getContext('2d')
        })

        it('creates a canvas of the provided size', () => {
          expect(canvas.width).to.eql(200)
          expect(canvas.height).to.eql(150)
        })

        it('draws the image onto the canvas using the default position', () => {
          expect(context.drawImage.lastCall.args).to.eql([
            image, 0, 250, 400, 300, 0, 0, 200, 150
          ])
        })
      })

      describe('for an image in landscape orientation', () => {
        beforeEach(() => {
          image = getImage(600, 300)
          canvas = version.getVersion(image)
          context = canvas.getContext('2d')
        })

        it('creates a canvas of the provided size', () => {
          expect(canvas.width).to.eql(200)
          expect(canvas.height).to.eql(150)
        })

        it('draws the image onto the canvas using the default position', () => {
          expect(context.drawImage.lastCall.args).to.eql([
            image, 100, 0, 400, 300, 0, 0, 200, 150
          ])
        })
      })
    })

    describe('with a provided box', () => {
      beforeEach(() => {
        version.setBox([100, 100, 200, 150])
        image = getImage(400, 800)
        canvas = version.getVersion(image)
        context = canvas.getContext('2d')
      })

      it('draws the image using the box', () => {
        expect(context.drawImage.lastCall.args).to.eql([
          image, 100, 100, 200, 150, 0, 0, 200, 150
        ])
      })
    })
  })
})
