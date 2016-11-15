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
    this.dragGesture(this.element.querySelector('.drag-box'), (data) => {
      const {containerBounds: b, handleBounds: hb, offsetX, offsetY, pageX, pageY} = data
      const x = pageX - offsetX
      const y = pageY - offsetY

      this.box.style.left = px(clamp(x, b.left, b.right - hb.width))
      this.box.style.top = px(clamp(y, b.top, b.bottom - hb.height))
    })

    this.dragGesture(this.element.querySelector('.top-left-handle'), (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, offsetX, pageX
      } = data

      const x = pageX - offsetX + (hb.width / 2)
      const ratio = this.version.getRatio()
      let newWidth = bb.right - x
      let newHeight = newWidth / ratio

      if (newHeight > b.height) {
        newHeight = b.height
        newWidth = newHeight * ratio
      }

      this.box.style.cssText = `
        left: ${px(clamp(bb.right - newWidth, b.left, b.right - hb.width))};
        top: ${px(clamp(bb.bottom - newHeight, b.top, b.bottom - hb.height))};
        width: ${px(newWidth)};
        height: ${px(newHeight)};
      `
    })
  }

  dragGesture (target, handler) {
    this.subscriptions.add(new DisposableEvent(target, 'mousedown', (e) => {
      const dragSubs = new CompositeDisposable()
      const handleBounds = target.getBoundingClientRect()
      const offsetX = e.pageX - handleBounds.left
      const offsetY = e.pageY - handleBounds.top

      dragSubs.add(new DisposableEvent(document.body, 'mousemove', (e) => {
        handler({
          handleBounds,
          containerBounds: this.container.getBoundingClientRect(),
          boxBounds: this.box.getBoundingClientRect(),
          offsetX, offsetY,
          pageX: e.pageX,
          pageY: e.pageY
        })
      }))

      dragSubs.add(new DisposableEvent(document.body, 'mouseup', (e) => {
        this.subscriptions.remove(dragSubs)
        dragSubs.dispose()
      }))

      this.subscriptions.add(dragSubs)
    }))
  }
}
