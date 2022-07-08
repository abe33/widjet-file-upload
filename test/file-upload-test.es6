import expect from 'expect.js';
import jsdom from 'mocha-jsdom';
import widgets from 'widjet';
import sinon from 'sinon';
import {setPageContent} from 'widjet-test-utils/dom';
import {waitsFor} from 'widjet-test-utils/async';

import '../src/file-upload';

import {pickFile, getFile, triggerImageLoad} from './helpers';

describe('file-preview', () => {
  jsdom({url: 'http://localhost'});
  triggerImageLoad();

  let input, hidden, uploadedSpy;

  beforeEach(() => {
    setPageContent(`
      <input type="file" id="file" name="file">
    `);

    uploadedSpy = sinon.spy();

    widgets('file-upload', 'input[type="file"]', {
      on: 'init',
      upload(file) {
        return Promise.resolve('some url').then((url) => {
          uploadedSpy();
          return url;
        });
      },
    });

    hidden = document.querySelector('#file-hidden');
    input = document.querySelector('#file');
  });

  afterEach(() => {
    widgets.release('file-preview');
  });

  it('creates a hidden input to contain the url after the upload', () => {
    expect(hidden).not.to.be(undefined);
  });

  it('removes the name of the original input to put it on the hidden one', () => {
    expect(input.name).to.eql('');
    expect(hidden.name).to.eql('file');
  });

  describe('when an image is picked from the disk', () => {
    let file;

    beforeEach(() => {
      file = getFile('foo.jpg', 'image/jpeg');
      pickFile(input, file);

      return waitsFor('preview loaded', () => uploadedSpy.called);
    });

    it('sets the value of the hidden field on the value returned by the upload promise', () => {
      expect(hidden.value).to.eql('some url');
    });
  });

  describe('initialized without an upload function', () => {
    it('throws an exception', () => {
      expect(() => {
        widgets('file-upload', 'input[type="file"]', {on: 'init'});
      }).to.throwError();
    });
  });

  describe('on a field without an id', () => {
    beforeEach(() => {
      setPageContent(`
        <input type="file" name="file">
      `);

      uploadedSpy = sinon.spy();

      widgets('file-upload', 'input[type="file"]', {
        on: 'init',
        upload(file) {
          return Promise.resolve('some url').then((url) => {
            uploadedSpy();
            return url;
          });
        },
      });

      hidden = document.querySelector('input[type="hidden"]');
      input = document.querySelector('input[type="file"');
    });

    it('creates one', () => {
      expect(input.id).not.to.eql('');
    });
  });
});
