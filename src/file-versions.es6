import widgets from 'widjet';
import {CompositeDisposable, DisposableEvent, Disposable} from 'widjet-disposables';
import {parent, getNode, asPair} from 'widjet-utils';
import Version from './version';
import {editVersion} from './version-editor';

widgets.define('file-versions', (options) => {
  const {versionsProvider, versionBoxesProvider, onVersionsChange} = options;

  const getVersion = options.getVersion || ((img, version) => {
    const canvas = version.getVersion(img);
    const div = getNode(`
      <div class="version">
        <button type="button" tabindex="-1"><span>Edit</span></button>
        <div class="version-meta">
          <span class="version-name">${version.name}</span>
          <span class="version-size">${version.size.join('x')}</span>
        </div>
      </div>
    `);
    div.appendChild(canvas, div.firstChild);
    return div;
  });
  return (input, widget) => {
    const container = parent(input, '.file-input');
    const versionsContainer = document.createElement('div');
    const versionsData = versionsProvider(input);
    const versionBoxesData = versionBoxesProvider(input);
    const versions = {};
    versionsContainer.classList.add('versions');

    widget.versions = versions;

    for (let versionName in versionsData) {
      versions[versionName] = new Version(versionName, versionsData[versionName]);
      if (versionBoxesData[versionName]) {
        versions[versionName].setBox(versionBoxesData[versionName]);
      }
    }

    container.appendChild(versionsContainer);
    let versionsSubs;

    return new CompositeDisposable([
      new DisposableEvent(input, 'preview:removed', () => {
        versionsContainer.innerHTML = '';
        versionsSubs && versionsSubs.dispose();
      }),
      new DisposableEvent(input, 'preview:loaded', () => {
        versionsContainer.innerHTML = '';
        versionsSubs && versionsSubs.dispose();

        const img = container.querySelector('img');

        if (img) {
          versionsSubs = new CompositeDisposable();

          asPair(versions).forEach(([versionName, version]) => {
            version.setBox();
            const div = getVersion(img, version);
            const btn = div.querySelector('button');

            versionsSubs.add(new DisposableEvent(btn, 'click', () => {
              editVersion(img, version).then((box) => {
                version.setBox(box);
                version.getVersion(img);
                onVersionsChange && onVersionsChange(input, collectVersions());
              }).catch(() => {});
            }));
            versionsContainer.appendChild(div);
          });
        }
      }),
      new Disposable(() => versionsSubs && versionsSubs.dispose()),
    ]);

    function collectVersions() {
      return asPair(versions).reduce((memo, [name, version]) => {
        memo[name] = version.box;
        return memo;
      }, {});
    }
  };
});
