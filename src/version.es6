import {head, last} from 'widjet-utils'

const ratio = ([w, h]) => w / h

const dimensions = (img) => [img.naturalWidth, img.naturalHeight]

export default class Version {
  constructor (name, size) {
    this.name = name
    this.size = size
    this.targetBox = [0, 0].concat(size)
    this.width = head(size)
    this.height = last(size)
  }

  setBox (box) {
    this.box = box
  }

  getVersion (image) {
    const [canvas, context] = this.getCanvas()
    this.box
      ? context.drawImage(image, ...this.box.concat(this.targetBox))
      : context.drawImage(image, ...this.getDefaultBox(image))
    return canvas
  }

  getCanvas () {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
      this.context = this.canvas.getContext('2d')

      this.canvas.width = this.width
      this.canvas.height = this.height
    }
    return [this.canvas, this.context]
  }

  getDefaultBox (image) {
    return ratio(dimensions(image)) > ratio(this.size)
      ? this.getDefaultHorizontalBox(image)
      : this.getDefaultVerticalBox(image)
  }

  getDefaultHorizontalBox (image) {
    const width = image.naturalHeight * ratio(this.size)
    return [
      (image.naturalWidth - width) / 2,
      0,
      width,
      image.naturalHeight
    ].concat(this.targetBox)
  }

  getDefaultVerticalBox (image) {
    const height = image.naturalWidth / ratio(this.size)
    return [
      0,
      (image.naturalHeight - height) / 2,
      image.naturalWidth,
      height
    ].concat(this.targetBox)
  }
}