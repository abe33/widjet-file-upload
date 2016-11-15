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

  getVersionBox () {
    const scale = this.source.width / this.source.naturalWidth
    const bounds = this.box.getBoundingClientRect()
    return [
      bounds.left / scale,
      bounds.top / scale,
      bounds.width / scale,
      bounds.height / scale
    ]
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
    this.dragGesture('.drag-box', (data) => {
      const {containerBounds: b, handleBounds: hb, offsetX, offsetY, pageX, pageY} = data
      const x = pageX - offsetX
      const y = pageY - offsetY

      this.box.style.left = px(clamp(x, b.left, b.right - hb.width))
      this.box.style.top = px(clamp(y, b.top, b.bottom - hb.height))
    })

    this.dragGesture('.top-left-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, offsetX, pageX
      } = data

      const x = pageX - offsetX + (hb.width / 2)
      const ratio = this.version.getRatio()
      let newWidth = bb.right - x
      let newHeight = newWidth / ratio

      ;[newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight
      ], [
        bb.right, bb.bottom
      ])

      this.updateBox(
        clamp(bb.right - newWidth, b.left, b.right - hb.width),
        clamp(bb.bottom - newHeight, b.top, b.bottom - hb.height),
        newWidth,
        newHeight
      )
    })

    this.dragGesture('.top-right-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, offsetX, pageX
      } = data

      const x = pageX - offsetX + (hb.width / 2)
      const ratio = this.version.getRatio()
      let newWidth = x - bb.left
      let newHeight = newWidth / ratio

      ;[newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight
      ], [
        b.width - bb.left, b.bottom
      ])

      this.updateBox(
        bb.left,
        clamp(bb.bottom - newHeight, b.top, b.bottom - hb.height),
        newWidth,
        newHeight
      )
    })

    this.dragGesture('.bottom-left-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, offsetX, pageX
      } = data

      const x = pageX - offsetX + (hb.width / 2)
      const ratio = this.version.getRatio()
      let newWidth = bb.right - x
      let newHeight = newWidth / ratio

      ;[newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight
      ], [
        bb.right, b.height - bb.top
      ])

      this.updateBox(
        clamp(bb.right - newWidth, b.left, b.right - hb.width),
        bb.top,
        newWidth,
        newHeight
      )
    })

    this.dragGesture('.bottom-right-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, offsetX, pageX
      } = data

      const x = pageX - offsetX + (hb.width / 2)
      const ratio = this.version.getRatio()
      let newWidth = x - bb.left
      let newHeight = newWidth / ratio

      ;[newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight
      ], [
        b.width - bb.left, b.height - bb.top
      ])

      this.updateBox(
        bb.left,
        bb.top,
        newWidth,
        newHeight
      )
    })

    this.dragGesture('img', (data) => {
      const {
        containerBounds: b, handleBounds: hb, offsetX, offsetY, pageX
      } = data

      const targetX = pageX - hb.left
      const ratio = this.version.getRatio()

      if (targetX < offsetX) {
        let newWidth = offsetX - targetX
        let newHeight = newWidth / ratio

        ;[newWidth, newHeight] = this.contraintBoxSize([
          newWidth, newHeight
        ], [
          offsetX, offsetY
        ])

        this.updateBox(
          targetX,
          offsetY - newHeight,
          newWidth,
          newHeight
        )
      } else {
        let newWidth = targetX - offsetX
        let newHeight = newWidth / ratio

        ;[newWidth, newHeight] = this.contraintBoxSize([
          newWidth, newHeight
        ], [
          b.width - offsetX, b.height - offsetY
        ])

        this.updateBox(
          offsetX,
          offsetY,
          newWidth,
          newHeight
        )
      }
    })
  }

  contraintBoxSize ([width, height], [maxWidth, maxHeight]) {
    const ratio = this.version.getRatio()

    if (width > maxWidth) {
      width = maxWidth
      height = width / ratio
    }

    if (height > maxHeight) {
      height = maxHeight
      width = height * ratio
    }

    return [width, height]
  }

  dragGesture (selector, handler) {
    const target = this.element.querySelector(selector)
    this.subscriptions.add(new DisposableEvent(target, 'mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()

      const dragSubs = new CompositeDisposable()
      const handleBounds = target.getBoundingClientRect()
      const offsetX = e.pageX - handleBounds.left
      const offsetY = e.pageY - handleBounds.top

      dragSubs.add(new DisposableEvent(document.body, 'mousemove', (e) => {
        e.preventDefault()
        e.stopPropagation()

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
        e.preventDefault()
        e.stopPropagation()

        this.subscriptions.remove(dragSubs)
        dragSubs.dispose()
      }))

      this.subscriptions.add(dragSubs)
    }))
  }
}
