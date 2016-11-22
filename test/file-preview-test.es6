import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import widgets from 'widjet'
import sinon from 'sinon'
import {getNode, last} from 'widjet-utils'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'
import {waitsFor} from 'widjet-test-utils/async'
import {click} from 'widjet-test-utils/events'

import {pickFile, getFile, triggerImageLoad} from './helpers'

import {formatSize} from '../src/file-preview'
import {previewBuilder, getTextPreview} from '../src/preview'

const getPreview = previewBuilder()

describe('formatSize()', () => {
  it('formats file size using the proper unit', () => {
    expect(formatSize(54)).to.eql('54B')
    expect(formatSize(1023)).to.eql('1.02kB')
    expect(formatSize(2315023)).to.eql('2.31MB')
    expect(formatSize(7542315023)).to.eql('7.54GB')
    expect(formatSize(1237542315023)).to.eql('1.23TB')
  })
})

describe('file-preview', () => {
  jsdom()
  triggerImageLoad()

  let wrapper, input, loadedSpy

  beforeEach(() => {
    setPageContent(`<input type="file" id="file" name="file">`)

    widgets('file-preview', 'input[type="file"]', {on: 'init'})

    wrapper = getTestRoot().querySelector('.file-input')
    input = wrapper.querySelector('input[type="file"]')
    loadedSpy = sinon.spy()
    getTestRoot().addEventListener('preview:loaded', loadedSpy)
  })

  afterEach(() => {
    widgets.release('file-preview')
  })

  it('wraps the input into a div', () => {
    expect(wrapper).not.to.be(null)
    expect(input).not.to.be(null)
  })

  it('uses the input for the label for attribute', () => {
    expect(wrapper.querySelector('label').getAttribute('for')).to.eql('file')
  })

  describe('when the input does not have has an id', () => {
    beforeEach(() => {
      setPageContent(`<input type="file" name="file">`)

      widgets('file-preview', 'input[type="file"]', {on: 'init'})

      wrapper = getTestRoot().querySelector('.file-input')
      input = wrapper.querySelector('input[type="file"]')
      loadedSpy = sinon.spy()
      getTestRoot().addEventListener('preview:loaded', loadedSpy)
    })

    it('generates an id for the file input', () => {
      expect(input.id).to.be.ok()
      expect(input.id).to.eql(wrapper.querySelector('label').getAttribute('for'))
    })
  })

  describe('when a file is already present', () => {
    let file
    beforeEach(() => {
      setPageContent(`<input type="file" id="file" name="file">`)

      file = getFile('foo.jpg', 'image/jpeg')
      input = getTestRoot().querySelector('input[type="file"]')

      pickFile(input, file, false)

      widgets('file-preview', 'input[type="file"]', {on: 'init'})

      wrapper = getTestRoot().querySelector('.file-input')

      return waitsFor('preview loaded', () => loadedSpy.called)
    })

    it('places the preview in the corresponding container', () => {
      const img = wrapper.querySelector('.preview img')
      expect(img).not.to.be(null)
    })

    it('fills the meta div with the preview information', () => {
      const img = wrapper.querySelector('.preview img')

      expect(wrapper.querySelector('.name').textContent).to.eql('foo.jpg')
      expect(wrapper.querySelector('.mime').textContent).to.eql('image/jpeg')
      expect(wrapper.querySelector('.dimensions').textContent).to.eql(`${img.width}x${img.height}px`)
      expect(wrapper.querySelector('.size').textContent).to.eql('3B')
    })
  })

  describe('when the input has a data-file attribute', () => {
    let url

    describe('that points to an image', () => {
      beforeEach(() => {
        url = new window.URL('http://abe33.github.io/atom-pigments/project-settings.png')

        loadedSpy = sinon.spy()
        setPageContent(`<input type="file" name="file" data-file="${url.href}">`)

        input = getTestRoot().querySelector('input[type="file"]')
        input.addEventListener('preview:loaded', loadedSpy)

        widgets('file-preview', 'input[type="file"]', {on: 'init'})

        wrapper = getTestRoot().querySelector('.file-input')

        return waitsFor('preview loaded', () => loadedSpy.called)
      })

      it('creates an image tag with the provided url', () => {
        const img = wrapper.querySelector('.preview img')
        expect(img).not.to.be(null)
      })

      it('fills the meta div with the image information', () => {
        const img = wrapper.querySelector('.preview img')

        expect(wrapper.querySelector('.name').textContent).to.eql(last(url.pathname.split('/')))
        expect(wrapper.querySelector('.mime').textContent).to.eql('image/png')
        expect(wrapper.querySelector('.dimensions').textContent).to.eql(`${img.naturalWidth}x${img.naturalHeight}px`)
        expect(wrapper.querySelector('.size').textContent).to.eql('68.12kB')
      })
    })
  })

  describe('when an image is picked from the disk', () => {
    let file

    beforeEach(() => {
      file = getFile('foo.jpg', 'image/jpeg')

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
      beforeEach(() => waitsFor('preview loaded', () => loadedSpy.called))

      it('updates the progress using the onprogress event information', () => {
        const progress = wrapper.querySelector('progress')
        return waitsFor('progress value changed', () => progress.value !== 0)
      })

      it('places the preview in the corresponding container', () => {
        const img = wrapper.querySelector('.preview img')
        expect(img).not.to.be(null)
      })

      it('removes the loading class from the input container', () => {
        expect(wrapper.classList.contains('loading')).not.to.be.ok()
      })

      it('fills the meta div with the preview information', () => {
        const img = wrapper.querySelector('.preview img')

        expect(wrapper.querySelector('.name').textContent).to.eql('foo.jpg')
        expect(wrapper.querySelector('.mime').textContent).to.eql('image/jpeg')
        expect(wrapper.querySelector('.dimensions').textContent).to.eql(`${img.width}x${img.height}px`)
        expect(wrapper.querySelector('.size').textContent).to.eql('3B')
      })

      describe('clicking on the reset button', () => {
        let promise, previousFile, spy

        beforeEach(() => {
          promise = getPreview({file})
          previousFile = file
          spy = sinon.spy()

          input.addEventListener('preview:removed', spy)

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

        it('emits a preview:removed event', () => {
          expect(spy.called).to.be.ok()
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

            return waitsFor('preview loaded', () => loadedSpy.called)
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

      widgets('file-preview', 'input[type="file"]', {
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
