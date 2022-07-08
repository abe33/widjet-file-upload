import widgets from 'widjet';
import {DisposableEvent} from 'widjet-disposables';

let id = 0;
const nextId = () => `file-upload-${++id}`;

widgets.define('file-upload', (options) => {
  const {upload} = options;

  if (!upload) {
    throw new Error('An upload function is mandatory');
  }
  return (input) => {
    const baseId = input.id != '' ? input.id : nextId();

    if (input.id == '') { input.id = baseId; }

    const target = document.createElement('input');
    target.id = `${baseId}-hidden`;
    target.type = 'hidden';
    target.name = input.name;

    input.removeAttribute('name');
    input.parentNode.insertBefore(target, input);

    return new DisposableEvent(input, 'change', (e) => {
      const file = input.files[0];
      upload(file).then((url) => {
        target.value = url;
      });
    });
  };
});
