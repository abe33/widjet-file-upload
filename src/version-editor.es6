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
    this.updateBox(
      boxData[0] * scale,
      boxData[1] * scale,
      boxData[2] * scale,
      boxData[3] * scale
    )
  }

  updateBox (left, top, width, height) {
    this.box.style.cssText = `
      left: ${px(left)};
      top: ${px(top)};
      width: ${px(width)};
      height: ${px(height)};
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

      ;[newWidth, newHeight] = this.contraintBoxSize([newWidth, newHeight], b)

      this.updateBox(
        clamp(bb.right - newWidth, b.left, b.right - hb.width),
        clamp(bb.bottom - newHeight, b.top, b.bottom - hb.height),
        newWidth,
        newHeight
      )
    })
  }

  contraintBoxSize ([width, height], bounds) {
    const ratio = this.version.getRatio()

    if (width > bounds.width) {
      width = bounds.width
      height = width / ratio
    }

    if (height > bounds.height) {
      height = bounds.height
      width = height * ratio
    }

    return [width, height]
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
