import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'

import {getPreview, disposePreview} from '../src/preview'
import {getFile} from './helpers'

describe('getPreview()', () => {
  jsdom()

  let file, promise

  describe('for an image file', (done) => {
    beforeEach(() => {
      file = getFile('foo.jpg', 'image/jpg')
      promise = getPreview({file})
    })

    it('returns a promise that resolve with an image', (done) => {
      promise.then((img) => {
        expect(img.nodeName).to.eql('IMG')
        expect(img.hasAttribute('src')).to.be.ok()
        done()
      })
    })

    describe('called a second time', () => {
      it('returns the same promise object', () => {
        expect(getPreview({file})).to.be(promise)
      })
    })

    describe('called with a progress callback', () => {
      beforeEach(() => {
        disposePreview(file)
      })

      it('sets the file reader progress handler with it', (done) => {
        const spy = sinon.spy()
        getPreview({file, onprogress: spy}).then(() => {
          expect(spy.called).to.be.ok()
          done()
        })
      })
    })
  })

  describe('for a non-image file', (done) => {
    beforeEach(() => {
      file = getFile('foo.pdf', 'application/pdf')
      promise = getPreview({file})
    })

    it('returns a promise that resolves with undefined', (done) => {
      promise.then((value) => {
        expect(value).to.be(undefined)
        done()
      })
    })
  })
})
