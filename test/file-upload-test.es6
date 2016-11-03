import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
// import sinon from 'sinon'
import widgets from 'widjet'

// import {click, keydown} from 'widjet-test-utils/events'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'

import '../src/index'

describe('file-upload', () => {
  jsdom()

  let wrapper

  beforeEach(() => {
    setPageContent(`<input type="file" name="file">`)

    widgets('file-upload', 'input[type="file"]', {on: 'init'})

    wrapper = getTestRoot().querySelector('.image-input')
  })

  it('wraps the input into a div', () => {
    expect(wrapper).not.to.be(null)
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
