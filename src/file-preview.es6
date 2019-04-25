import widgets from 'widjet';
import {DisposableEvent, CompositeDisposable} from 'widjet-disposables';
import {getNode, when, merge, last} from 'widjet-utils';

import {previewBuilder, disposePreview} from './preview';

let id = 0;
const nextId = () => `file-input-${++id}`;

widgets.define('file-preview', (options) => {
  const {
    wrap, previewSelector, nameMetaSelector, mimeMetaSelector,
    dimensionsMetaSelector, sizeMetaSelector, progressSelector,
    resetButtonSelector, formatSize, formatDimensions,
  } = merge(defaults, options);

  const getPreview = previewBuilder(options.previewers);

  return (input) => {
    if (!input.id) { input.id = nextId(); }

    const container = input.parentNode;
    const nextSibling = input.nextElementSibling;
    const wrapper = wrap(input);
    container.insertBefore(wrapper, nextSibling);

    const previewContainer = wrapper.querySelector(previewSelector);
    const size = wrapper.querySelector(sizeMetaSelector);
    const dimensions = wrapper.querySelector(dimensionsMetaSelector);
    const name = wrapper.querySelector(nameMetaSelector);
    const mime = wrapper.querySelector(mimeMetaSelector);
    const progress = wrapper.querySelector(progressSelector);
    const resetButton = wrapper.querySelector(resetButtonSelector);
    const onprogress = (e) => e.total > 0 && writeValue(progress, (e.loaded / e.total) * 100);

    const composite = new CompositeDisposable();

    resetButton && composite.add(new DisposableEvent(resetButton, 'click', () => {
      input.value = '';
      widgets.dispatch(input, 'change');
      widgets.dispatch(input, 'preview:removed');
    }));

    composite.add(new DisposableEvent(input, 'change', (e) => {
      resetField();
      createPreview();
    }));

    if (input.files.length) {
      createPreview();
    } else if (input.hasAttribute('data-file')) {
      createPreviewFromURL();
    }

    return composite;

    function createPreview() {
      const file = input.files[0];
      file && createFilePreview(file);
    }

    function createPreviewFromURL() {
      wrapper.classList.add('loading');
      const url = new window.URL(input.getAttribute('data-file'));
      const req = new window.XMLHttpRequest();
      req.responseType = 'arraybuffer';
      req.onprogress = onprogress;
      req.onload = (e) => {
        wrapper.classList.remove('loading');
        const type = req.getResponseHeader('Content-Type');
        const lastModified = new Date(req.getResponseHeader('Last-Modified'));
        const parts = [new window.Blob([req.response], {type})];
        const file = new window.File(parts, last(url.pathname.split('/')), {type, lastModified});
        createFilePreview(file);
      };
      req.open('GET', url.href);
      req.send();
    }

    function createFilePreview(file) {
      wrapper.classList.add('loading');
      writeValue(progress, 0);

      return getPreview({file, onprogress}).then((preview) => {
        preview && preview.nodeName === 'IMG' && !preview.complete
          ? preview.onload = () => {
            writeText(dimensions, formatDimensions(preview));
            previewLoaded(file);
          }
          : previewLoaded(file);

        if (preview) { previewContainer.appendChild(preview); }
        filesById[input.id] = file;
        widgets.dispatch(input, 'preview:ready');
      });
    }

    function previewLoaded(file) {
      writeText(size, formatSize(file.size));
      writeText(name, file.name);
      writeText(mime, file.type);
      wrapper.classList.remove('loading');
      widgets.dispatch(input, 'preview:loaded');
    }

    function resetField() {
      if (filesById[input.id]) {
        disposePreview(filesById[input.id]);
        delete filesById[input.id];
      }

      progress && progress.removeAttribute('value');
      previewContainer.innerHTML = '';
      writeText(size, '');
      writeText(name, '');
      writeText(mime, '');
      writeText(dimensions, '');
    }
  };
});

const filesById = {};

const writeText = (node, value) => node && (node.textContent = value);

const writeValue = (node, value) => node && (node.value = value);

const unitPerSize = ['B', 'kB', 'MB', 'GB', 'TB'].map((u, i) =>
  [Math.pow(1000, i + 1), u, i === 0 ? 1 : Math.pow(1000, i)]
);

const round = n => Math.floor(n * 100) / 100;

export const formatSize = when(unitPerSize.map(([limit, unit, divider]) =>
  [n => n < limit / 2, n => [round(n / divider), unit].join('')])
);

export const formatDimensions = (image) =>
  `${image.naturalWidth || image.width}x${image.naturalHeight || image.height}px`;

const defaults = {
  previewSelector: '.preview',
  nameMetaSelector: '.meta .name',
  mimeMetaSelector: '.meta .mime',
  dimensionsMetaSelector: '.meta .dimensions',
  progressSelector: 'progress',
  resetButtonSelector: 'button',
  sizeMetaSelector: '.meta .size',
  formatSize,
  formatDimensions,
  wrap: (input) => {
    const wrapper = getNode(`
      <div class="file-input">
        <div class='file-container'>
          <label for="${input.id}"></label>
          <div class="preview"></div>
          <button type="button" tabindex="-1"><span>Reset</span></button>
        </div>

        <progress min="0" max="100"></progress>

        <div class="meta">
          <div class="name"></div>
          <div class="mime"></div>
          <div class="size"></div>
          <div class="dimensions"></div>
        </div>
      </div>
    `);

    const label = wrapper.querySelector('label');
    label.parentNode.insertBefore(input, label);
    return wrapper;
  },
};
