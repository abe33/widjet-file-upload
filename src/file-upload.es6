import widgets from 'widjet';
import {DisposableEvent} from 'widjet-disposables';

let id = 0;
const nextId = () => `file-upload-${++id}`;

widgets.define('file-upload', (options) => {
  let {upload, nameAttribute, valueAttribute} = options;

  if (nameAttribute == undefined) { nameAttribute = 'name'; }
  if (valueAttribute == undefined) { valueAttribute = 'value'; }

  if (!upload) {
    throw new Error('An upload function is mandatory');
  }
  return (input) => {
    const baseId = input.id != '' ? input.id : nextId();

    if (input.id == '') { input.id = baseId; }

    const target = document.createElement('input');
    target.id = `${baseId}-hidden`;
    target.type = 'hidden';
    target.setAttribute(nameAttribute, input.getAttribute(nameAttribute));
    target.setAttribute(valueAttribute, input.getAttribute(valueAttribute));
    input.removeAttribute(nameAttribute);
    input.removeAttribute(valueAttribute);

    input.parentNode.insertBefore(target, input);

    return new DisposableEvent(input, 'change', (e) => {
      const file = input.files[0];
      upload(file).then((url) => {
        target.value = url;
      });
    });
  };
});
