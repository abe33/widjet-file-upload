import {getNode, when, always} from 'widjet-utils';

const previewsByFileKeys = {};

export function fileKey(file) {
  return `${file.name}-${file.type}-${file.size}-${file.lastModified}`;
}

const imageType = (...ts) => {
  const types = ts.map(t => new RegExp(`\\bimage/${t}\\b`));
  return o => types.some(re => re.test(o.file.type));
};

export const DEFAULT_PREVIEWERS = [
  [imageType('jpeg', 'png', 'gif', 'bmp', 'svg+xml'), getImagePreview],
  [always, o => Promise.resolve()],
];

export const previewBuilder = (previewers = []) => {
  const previewer = when(previewers.concat(DEFAULT_PREVIEWERS));
  return (o) => {
    const key = fileKey(o.file);
    return previewsByFileKeys[key]
      ? previewsByFileKeys[key]
      : previewsByFileKeys[key] = previewer(o);
  };
};

export function disposePreview(file) {
  delete previewsByFileKeys[fileKey(file)];
}

export function resetPreviewCache() {
  for (let key in previewsByFileKeys) { delete previewsByFileKeys[key]; }
}

export function getImagePreview({file, onprogress}) {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = (e) => resolve(getNode(`<img src="${e.target.result}">`));
    reader.onerror = reject;
    reader.onprogress = onprogress;
    reader.readAsDataURL(file);
  });
}

export function getTextPreview({file, onprogress}) {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = (e) => resolve(getNode(`<pre>${e.target.result}</pre>`));
    reader.onerror = reject;
    reader.onprogress = onprogress;
    reader.readAsText(file);
  });
}

export function getPDFPreview({file, onprogress}) {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = (e) => resolve(getNode(`<iframe src="${e.target.result}"></iframe>`));
    reader.onerror = reject;
    reader.onprogress = onprogress;
    reader.readAsDataURL(file);
  });
}
