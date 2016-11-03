import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import widgets from 'widjet'
import {getNode} from 'widjet-utils'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'

import {pickFile, getFile} from './helpers'

import '../src/index'
import {previewBuilder, getTextPreview} from '../src/preview'

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
      let promise, previousFile
      beforeEach(() => {
        promise = getPreview({file})
        previousFile = file

        file = getFile('bar.jpg', 'image/jpeg')
        pickFile(input, file)

        return getPreview({file})
      })

      it('removes the previous preview image', () => {
        expect(wrapper.querySelectorAll('.preview img')).to.have.length(1)
      })

      it('clears the previously cached preview promise', () => {
        expect(getPreview({file: previousFile})).not.to.be(promise)
      })
    })
  })

  describe('with options', () => {
    beforeEach(() => {
      setPageContent(`<input type="file" name="file">`)

      widgets('file-upload', 'input[type="file"]', {
        on: 'init',
        previewSelector: '.preview',
        nameMetaSelector: '.name',
        mimeMetaSelector: '.mime',
        dimensionsMetaSelector: '.dimensions',
        sizeMetaSelector: '.size',
        previewers: [[o => o.file.type === 'text/plain', getTextPreview]],
        formatSize: n => `${n}o`,
        formatDimensions: i => `${i.width}px, ${i.height}px`,
        wrap: input => {
          const wrapper = getNode(`
            <label>
              <span class='name'></span>
              <span class='mime'></span>
              <span class='dimensions'></span>
              <span class='size'></span>
              <span class='preview'></span>
            </label>
          `)
          wrapper.appendChild(input)
          return wrapper
        }
      })

      wrapper = getTestRoot().querySelector('label')
      input = wrapper.querySelector('input[type="file"]')
    })

    it('invokes the provided wrap function', () => {
      expect(wrapper).not.to.be(null)
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

        expect(wrapper.querySelector('.name').textContent).to.eql('foo.jpg')
        expect(wrapper.querySelector('.mime').textContent).to.eql('image/jpeg')
        expect(wrapper.querySelector('.dimensions').textContent).to.eql('0px, 0px')
        expect(wrapper.querySelector('.size').textContent).to.eql('3o')
      })
    })

    describe('when a text file is picked from the disk', () => {
      let file

      beforeEach(() => {
        file = getFile('foo.txt', 'text/plain')
        pickFile(input, file)

        return getPreview({file})
      })

      it('generates a text preview', () => {
        const pre = wrapper.querySelector('.preview pre')
        expect(pre).not.to.be(null)
        expect(pre.textContent).to.eql('foo')
      })

      it('fills the meta div with the preview information', () => {
        expect(wrapper.querySelector('.name').textContent).to.eql('foo.txt')
        expect(wrapper.querySelector('.mime').textContent).to.eql('text/plain')
        expect(wrapper.querySelector('.dimensions').textContent).to.eql('')
        expect(wrapper.querySelector('.size').textContent).to.eql('3o')
      })
    })
  })
})
