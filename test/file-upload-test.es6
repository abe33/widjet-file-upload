import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
// import sinon from 'sinon'
import widgets from 'widjet'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'

import {pickFile, getFile} from './helpers'

import '../src/index'
import {previewBuilder} from '../src/preview'

const getPreview = previewBuilder()

describe('file-upload', () => {
  jsdom()

  let wrapper, input

  beforeEach(() => {
    setPageContent(`<input type="file" name="file">`)

    widgets('file-upload', 'input[type="file"]', {on: 'init'})

    wrapper = getTestRoot().querySelector('.image-input')
    input = wrapper.querySelector('input[type="file"]')
  })

  it('wraps the input into a div', () => {
    expect(wrapper).not.to.be(null)
    expect(input).not.to.be(null)
  })

  describe('when an image is picked from the disk', () => {
    let file

    beforeEach(() => {
      file = getFile('foo.jpg', 'image/jpeg')
      pickFile(input, file)

      return getPreview({file})
    })

    it('generates a preview image', () => {
      const img = wrapper.querySelector('.preview img')
      expect(img).not.to.be(null)
    })

    it('fills the meta div with the preview information', () => {
      const img = wrapper.querySelector('.preview img')
      // forces call of the dummy image callback since it's not a proper image
      img.onload()

      expect(wrapper.querySelector('.meta .name').textContent).to.eql('foo.jpg')
      expect(wrapper.querySelector('.meta .mime').textContent).to.eql('image/jpeg')
      expect(wrapper.querySelector('.meta .dimensions').textContent).to.eql('0x0px')
      expect(wrapper.querySelector('.meta .size').textContent).to.eql('3B')
    })

    describe('changing it again', () => {
      beforeEach(() => {
        file = getFile('bar.jpg', 'image/jpeg')
        pickFile(input, file)

        return getPreview({file})
      })

      it('removes the previous preview image', () => {
        expect(wrapper.querySelectorAll('.preview img')).to.have.length(1)
      })
    })
  })

  describe('with a custom wrap function', () => {
    beforeEach(() => {
      setPageContent(`<input type="file" name="file">`)

      widgets('file-upload', 'input[type="file"]', {
        on: 'init',
        wrap: input => {
          const wrapper = document.createElement('label')
          wrapper.appendChild(input)
          return wrapper
        }
      })

      wrapper = getTestRoot().querySelector('label')
    })

    it('invokes the provided wrap function', () => {
      expect(wrapper).not.to.be(null)
    })
  })
})
