import sinon from 'sinon';
import {asArray} from 'widjet-utils';
import {createEvent} from 'widjet-test-utils/events';
import {getTestRoot} from 'widjet-test-utils/dom';
import {resetPreviewCache} from '../src/preview';

function dataURIify(type, data) {
  return `data:${type};base64,${data}`;
}

function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new window.Blob([ab], {type: mimeString});
  return blob;
}

export const BLOB_CONTENTS = {
  'image/gif': 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
  'image/png': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==',
  'image/jpeg': '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
};

export const BLOB_SIZES = {
  'image/jpeg': '0.63kB',
  'image/png': '0.63kB',
  'image/gif': '0.63kB',
};

export function getFile(name, type) {
  let data;
  if (BLOB_CONTENTS[type] != undefined) {
    data = dataURItoBlob(dataURIify(type, BLOB_CONTENTS[type]));
  } else {
    data = 'foo';
  }

  return new window.File([data], name, {type, lastModified: new Date()});
}

export function pickFile(input, file, changeEvent = true) {
  Object.defineProperty(input, 'files', {
    get: () => file ? [file] : [],
    configurable: true,
  });
  if (changeEvent) { change(input); }
}

export function getImage(width, height, screenWidth = width, screenHeight = height) {
  const image = document.createElement('img');
  Object.defineProperty(image, 'naturalWidth', { get: () => width });
  Object.defineProperty(image, 'naturalHeight', { get: () => height });
  image.width = screenWidth;
  image.height = screenHeight;
  return image;
}

export function change(target) {
  target.dispatchEvent(createEvent('Event', 'change'));
}

export function triggerImageLoad(cb) {
  if (typeof process !== 'undefined') {
    let listener;
    beforeEach(() => {
      listener = () => {
        asArray(getTestRoot().querySelectorAll('img'))
          .forEach(img => img.onload && img.onload());
      };
      getTestRoot().addEventListener('preview:ready', listener);
    });

    afterEach(() => {
      getTestRoot().removeEventListener('preview:ready', listener);
    });
  }
}

export function withFakeContext() {
  let safGetContext;
  beforeEach(() => {
    resetPreviewCache();
    const editor = document.body.querySelector('.version-editor');
    if (editor) {
      editor.remove();
    }

    const FakeContext = {
      drawImage: sinon.spy(),
      clearRect: sinon.spy(),
    };

    safGetContext = window.HTMLCanvasElement.prototype.getContext;
    window.HTMLCanvasElement.prototype.getContext = () => FakeContext;
  });

  afterEach(() => {
    window.HTMLCanvasElement.prototype.getContext = safGetContext;
  });
}
