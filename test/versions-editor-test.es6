import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import widgets from 'widjet'
// import sinon from 'sinon'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'

import '../src/index'

import {pickFile, getFile} from './helpers'

describe('versions-editor', () => {
  jsdom()

  let wrapper, input

  beforeEach(() => {
    const versions = {
      small: [240, 180],
      medium: [640, 480],
      wide: [640, 360]
    }

    setPageContent(`
      <input type="file"
             name="file"
             data-versions="${JSON.stringify(versions)}">
    `)

    widgets('file-preview', 'input[type="file"]', {on: 'init'})
    widgets('versions-editor', 'input[type="file"]', {on: 'init'})

    wrapper = getTestRoot().querySelector('.file-input')
    input = wrapper.querySelector('input[type="file"]')
  })

  it('appends a versions container in the image input', () => {
    expect(wrapper.querySelector('.versions')).not.to.be(null)
  })

  describe('when an image is picked', () => {
    beforeEach(() => {
      pickFile(input, getFile('foo.jpg', 'image/jpeg'))
    })

    it('appends a canvas for each version defined on the input', () => {})
  })
})
