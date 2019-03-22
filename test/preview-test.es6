import expect from 'expect.js';
import jsdom from 'mocha-jsdom';
import sinon from 'sinon';

import {previewBuilder, disposePreview, resetPreviewCache, getTextPreview, getPDFPreview} from '../src/preview';
import {getFile} from './helpers';

describe('previewBuilder()', () => {
  jsdom({url: 'http://localhost'});

  let file, promise, getPreview, spy;

  beforeEach(() => {
    resetPreviewCache();
  });

  describe('without any previewers', () => {
    beforeEach(() => {
      getPreview = previewBuilder();
    });

    describe('for an image file', (done) => {
      describe('with a simple content-type', () => {

        beforeEach(() => {
          file = getFile('foo.jpg', 'image/jpeg');
          promise = getPreview({file});
        });

        it('returns a promise that resolve with an image', (done) => {
          promise.then((img) => {
            expect(img.nodeName).to.eql('IMG');
            expect(img.hasAttribute('src')).to.be.ok();
            done();
          });
        });

        describe('called a second time', () => {
          it('returns the same promise object', () => {
            expect(getPreview({file})).to.be(promise);
          });
        });

        describe('called with a progress callback', () => {
          beforeEach(() => {
            disposePreview(file);
          });

          it('sets the file reader progress handler with it', (done) => {
            spy = sinon.spy();
            getPreview({file, onprogress: spy}).then(() => {
              expect(spy.called).to.be.ok();
              done();
            });
          });
        });
      });

      describe('with a more complex content-type', () => {

        beforeEach(() => {
          file = getFile('foo.jpg', 'image/jpeg; charset=binary');
          promise = getPreview({file});
        });

        it('returns a promise that resolve with an image', (done) => {
          promise.then((img) => {
            expect(img.nodeName).to.eql('IMG');
            expect(img.hasAttribute('src')).to.be.ok();
            done();
          });
        });

        describe('called a second time', () => {
          it('returns the same promise object', () => {
            expect(getPreview({file})).to.be(promise);
          });
        });

        describe('called with a progress callback', () => {
          beforeEach(() => {
            disposePreview(file);
          });

          it('sets the file reader progress handler with it', (done) => {
            spy = sinon.spy();
            getPreview({file, onprogress: spy}).then(() => {
              expect(spy.called).to.be.ok();
              done();
            });
          });
        });
      });
    });

    describe('for a non-image binary file', (done) => {
      beforeEach(() => {
        file = getFile('foo.pdf', 'application/pdf');
        promise = getPreview({file});
      });

      it('returns a promise that resolves with undefined', (done) => {
        promise.then((value) => {
          expect(value).to.be(undefined);
          done();
        });
      });
    });
  });

  describe('with some custom previewer', () => {
    describe('for a pdf file', () => {
      beforeEach(() => {
        getPreview = previewBuilder([
          [o => o.file.type === 'application/pdf', getPDFPreview],
        ]);
        file = getFile('foo.pdf', 'application/pdf');
        promise = getPreview({file});
      });

      it('returns an iframe tag with the file content', () => {
        return promise.then((value) => {
          expect(value.nodeName).to.eql('IFRAME');
        });
      });

      it('returns the same promise on successive calls', () => {
        expect(getPreview({file})).to.be(promise);
      });
    });

    describe('for a text file', (done) => {
      beforeEach(() => {
        getPreview = previewBuilder([
          [o => o.file.type === 'text/plain', getTextPreview],
        ]);
        file = getFile('foo.txt', 'text/plain');
        promise = getPreview({file});
      });

      it('returns pre tag with the file content', () => {
        return promise.then((value) => {
          expect(value.outerHTML).to.eql('<pre>foo</pre>');
        });
      });
    });
  });
});
