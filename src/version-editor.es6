import {CompositeDisposable, DisposableEvent} from 'widjet-disposables'
import {getNode, cloneNode} from 'widjet-utils'

const px = (v) => `${v}px`
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export default class VersionEditor {
  constructor (source, version) {
    const node = getNode(`
      <div class="version-editor">
        <div class="version-preview">
          <div class="version-box">
            <div class="drag-box"></div>
            <div class="top-left-handle"></div>
            <div class="top-right-handle"></div>
            <div class="bottom-left-handle"></div>
            <div class="bottom-right-handle"></div>
          </div>
        </div>
        <div class="actions">
          <button type="button" tabindex="-1"><span>Cancel</span></button>
          <button type="button" tabindex="-1"><span>Save</span></button>
        </div>
      </div>
      `)

    const box = node.querySelector('.version-box')
    const container = node.querySelector('.version-preview')
    container.insertBefore(cloneNode(source), container.firstElementChild)

    this.source = source
    this.version = version
    this.element = node
    this.box = box
    this.container = container

    this.boxToPreview(version.getBox(source))

    this.subscriptions = new CompositeDisposable()

    this.subscribeToDragBox()
  }

  boxToPreview (boxData) {
    const scale = this.source.width / this.source.naturalWidth
    this.box.style.cssText = `
      left: ${boxData[0] * scale}px;
      top: ${boxData[1] * scale}px;
      width: ${boxData[2] * scale}px;
      height: ${boxData[3] * scale}px;
    `
  }

  subscribeToDragBox () {
    const dragBox = this.element.querySelector('.drag-box')

    this.subscriptions.add(new DisposableEvent(dragBox, 'mousedown', (e) => {
      const dragSubs = new CompositeDisposable()
      const bounds = this.container.getBoundingClientRect()

      const {top, left, width, height} = dragBox.getBoundingClientRect()
      const offsetX = e.pageX - left
      const offsetY = e.pageY - top

      dragSubs.add(new DisposableEvent(document.body, 'mousemove', (e) => {
        const x = e.pageX - offsetX
        const y = e.pageY - offsetY

        this.box.style.left = px(clamp(x, bounds.left, bounds.right - width))
        this.box.style.top = px(clamp(y, bounds.top, bounds.bottom - height))
      }))

      dragSubs.add(new DisposableEvent(document.body, 'mouseup', (e) => {
        dragSubs.dispose()
      }))
    }))
  }
}
