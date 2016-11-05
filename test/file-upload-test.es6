import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import widgets from 'widjet'
import sinon from 'sinon'
import {getNode} from 'widjet-utils'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'
import {waitsFor} from 'widjet-test-utils/async'
import {click} from 'widjet-test-utils/events'

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
    let file, spy

    beforeEach(() => {
      spy = sinon.spy()
      file = getFile('foo.jpg', 'image/jpeg')
      input.addEventListener('preview:ready', spy)

      pickFile(input, file)
    })

    it('adds the loading class on the input container', () => {
      expect(wrapper.classList.contains('loading')).to.be.ok()
    })

    it('resets the progress value', () => {
      const progress = wrapper.querySelector('progress')
      expect(progress.value).to.equal(0)
    })

    describe('when the preview have been generated', () => {
      beforeEach(() => getPreview({file}).then((img) => img.onload()))

      it('has updated the progress using the onprogress event information', () => {
        const progress = wrapper.querySelector('progress')
        expect(progress.value).not.to.equal(0)
      })

      it('places the preview in the corresponding container', () => {
        const img = wrapper.querySelector('.preview img')
        expect(img).not.to.be(null)
      })

      it('removes the loading class from the input container', () => {
        expect(wrapper.classList.contains('loading')).not.to.be.ok()
      })

      it('emits a preview:ready event', () => waitsFor(() => spy.called))

      it('fills the meta div with the preview information', () => {
        const img = wrapper.querySelector('.preview img')

        expect(wrapper.querySelector('.name').textContent).to.eql('foo.jpg')
        expect(wrapper.querySelector('.mime').textContent).to.eql('image/jpeg')
        expect(wrapper.querySelector('.dimensions').textContent).to.eql(`${img.width}x${img.height}px`)
        expect(wrapper.querySelector('.size').textContent).to.eql('3B')
      })

      describe('clicking on the reset button', () => {
        let promise, previousFile

        beforeEach(() => {
          promise = getPreview({file})
          previousFile = file

          const button = wrapper.querySelector('button')
          click(button)
        })

        it('resets the input value', () => {
          expect(input.value).to.eql('')
        })

        it('removes the previous preview image', () => {
          expect(wrapper.querySelectorAll('.preview img')).to.have.length(0)
        })

        it('clears the previously cached preview promise', () => {
          expect(getPreview({file: previousFile})).not.to.be(promise)
        })

        it('clears the meta', () => {
          expect(wrapper.querySelector('.name').textContent).to.eql('')
          expect(wrapper.querySelector('.mime').textContent).to.eql('')
          expect(wrapper.querySelector('.dimensions').textContent).to.eql('')
          expect(wrapper.querySelector('.size').textContent).to.eql('')
        })
      })

      describe('changing it again', () => {
        let promise, previousFile

        beforeEach(() => {
          promise = getPreview({file})
          previousFile = file
        })

        describe('to another file', () => {
          beforeEach(() => {
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

        describe('to no file', () => {
          beforeEach(() => {
            pickFile(input)
          })

          it('removes the previous preview image', () => {
            expect(wrapper.querySelectorAll('.preview img')).to.have.length(0)
          })

          it('clears the previously cached preview promise', () => {
            expect(getPreview({file: previousFile})).not.to.be(promise)
          })

          it('clears the meta', () => {
            expect(wrapper.querySelector('.name').textContent).to.eql('')
            expect(wrapper.querySelector('.mime').textContent).to.eql('')
            expect(wrapper.querySelector('.dimensions').textContent).to.eql('')
            expect(wrapper.querySelector('.size').textContent).to.eql('')
          })
        })
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
        expect(wrapper.querySelector('.dimensions').textContent).to.eql(`${img.width}px, ${img.height}px`)
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
