import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import widgets from 'widjet'

import {click, keydown} from 'widjet-test-utils/events'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'

import '../src/index'

describe.skip('file-upload', () => {
  jsdom()

  beforeEach(() => {
    setPageContent(`<input type="file" name="file">`)
  })

  it('', () => {

  })
})
