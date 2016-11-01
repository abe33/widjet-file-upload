import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'
import widgets from 'widjet'

import {click, keydown} from 'widjet-test-utils/events'
import {waitsFor} from 'widjet-test-utils/async'
import {setPageContent, getTestRoot} from 'widjet-test-utils/dom'

import '../src/index'

describe('file-upload', () => {
  jsdom()

  beforeEach(() => {
    setPageContent(``)

  })
})
