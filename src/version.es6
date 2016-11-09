import {head, last} from 'widjet-utils'

export default class Version {
  constructor (name, size) {
    this.name = name
    this.width = head(size)
    this.height = last(size)
  }

  getVersion (image) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    canvas.width = this.width
    canvas.height = this.height
    const box = this.getDefaultBox(image)
    context.drawImage(image, ...box)
    return canvas
  }

  getDefaultBox (image) {
    return [0, 250, 400, 300]
  }
}
