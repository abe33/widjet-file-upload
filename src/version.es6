import {head, last} from 'widjet-utils'
import {ratio, dimensions} from './utils'

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
    context.drawImage(image, ...this.getBox(image))
    return canvas
  }

  getRatio () { return ratio(this.size) }

  getCanvas () {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
      this.context = this.canvas.getContext('2d')

      this.canvas.width = this.width
      this.canvas.height = this.height
    }
    return [this.canvas, this.context]
  }

  getBox (image) {
    return this.box
      ? this.box.concat(this.targetBox)
      : this.getDefaultBox(image)
  }

  getDefaultBox (image) {
    return ratio(dimensions(image)) > this.getRatio()
      ? this.getDefaultHorizontalBox(image)
      : this.getDefaultVerticalBox(image)
  }

  getDefaultHorizontalBox (image) {
    const width = image.naturalHeight * this.getRatio()
    return [
      (image.naturalWidth - width) / 2,
      0,
      width,
      image.naturalHeight
    ].concat(this.targetBox)
  }

  getDefaultVerticalBox (image) {
    const height = image.naturalWidth / this.getRatio()
    return [
      0,
      (image.naturalHeight - height) / 2,
      image.naturalWidth,
      height
    ].concat(this.targetBox)
  }
}
