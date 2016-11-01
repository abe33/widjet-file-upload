
export function getFile (name, type) {
  return new window.File(['foo'], name, {type, lastModified: new Date()})
}
