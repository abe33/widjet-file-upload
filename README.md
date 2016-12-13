# widjet-file-upload [![Build Status](https://travis-ci.org/abe33/widjet-file-upload.svg?branch=master)](https://travis-ci.org/abe33/widjet-file-upload) [![codecov](https://codecov.io/gh/abe33/widjet-file-upload/branch/master/graph/badge.svg)](https://codecov.io/gh/abe33/widjet-file-upload)

A widget to display and upload files in a form.

## Install

```sh
npm install --save widjet-file-upload
```

### Usage

```js
import widgets from 'widjet'
import 'widjet-file-upload'

widgets('file-preview', 'input[type="file"]', {on: 'load'})
widgets('file-versions', 'input[type="file"][data-versions]', {
  on: 'load',
  versionsProvider: (el) =>
    el.hasAttribute('data-versions')
      ? JSON.parse(el.getAttribute('data-versions'))
      : {},
  versionBoxesProvider: (el) =>
    el.hasAttribute('data-version-boxes')
      ? JSON.parse(el.getAttribute('data-version-boxes'))
      : {}
  onVersionsChange: (input, versions) =>
    console.log('versions of', input, 'have been changed to', versions)
})
```

This package exports two widgets, `file-preview` and `file-versions`.

The former is used to provide a preview of a file picked using a file input.

The latter is used to edit various versions of an uploaded image.

Both widgets works on a file input, but `file-versions` will require that you enable `file-preview` beforehand on an input to be effective.

### File Preview

The `file-preview` widget wraps a `file` input into a `file-input` `div` that will be used to display a file preview and various information about the picked file. It also listens to the `change` event and will attempt to generate a preview for that file based on the defined previewers.

The `file-preview` widget rely on the `FileReader` API and will be constrained by its support. This can be handled using the following condition:

```js
widgets('file-preview', 'input[type="file"]', {
  on: 'load',
  if: window.FileReader != undefined
})
```

#### Options

Name|Type|Description
---|---|---
`previewers`|`array`|An array of custom previewers to use. See below for documentation on how previewers work.
`wrap`|`function`|A function that takes the target element as attribute and should wrap it into the preview component. The function must return the generated wrapper element.
`previewSelector`|`string`|A CSS selector string to retrieve the preview container where appending the generated previews.
`nameMetaSelector`|`string`|A CSS selector string to retrieve the element where the picked file name should be displayed.
`mimeMetaSelector`|`string`|A CSS selector string to retrieve the element where the picked file mime type should be displayed.
`dimensionsMetaSelector`|`string`|A CSS selector string to retrieve the element where the picked file dimensions should be displayed. This element will only be filled if the picked file is an image.
`sizeMetaSelector`|`string`|A CSS selector string to retrieve the element where the picked file size on disk should be displayed.
`progressSelector`|`string`|A CSS selector string to retrieve the progress bar element used to display the preview generation progress.
`resetButtonSelector`|`string`|A CSS selector string to retrieve the button used to clear the field of its value.
`formatSize`|`function`|A function that takes a file size as an integer and should return a humanized version of that size.
`formatDimensions`|`function`|A function that takes an image element and should return a humanized version of its dimensions.

#### Custom Previewers

A previewer is an array containing two functions. The first function is the predicate that, with an object as input, will tell whether the preview can be generated using the second function.

The function takes also an object as input and must returns a `Promise` that will resolve with the generated preview. The promise might resolve with either a DOM node or `undefined` if there's no preview for the file (this is the default behaviour of the catch all previewer).

The object passed to the two functions have the following properties:

Name|Type|Description
---|---|---
`file`|`File`|The file for which generating the preview.
`onprogress`|`function`|A function that be used to notify the widget of the preview generation progress.

Here's an example with a previewer that handles text files and will generates a `pre` tag with the file content:

```js
const textPreviewer = [o => o.file.type === 'text/plain', getTextPreview]

function getTextPreview ({file, onprogress}) {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader()
    reader.onload = (e) => {
      const pre = document.createElement('pre')
      pre.textContent = e.target.result
      resolve(pre)
    }
    reader.onerror = reject
    reader.onprogress = onprogress
    reader.readAsText(file)
  })
}
```

#### Default Previewers

Currently, there's only two default previewers, the image previewer that will match for image file types (`image/jpeg`, `image/png`, `image/gif`, `image/bmp` and `image/svg+xml` mime types) and the catch all previewer that doesn't generate preview.

The package also comes with a couple of default preview functions that are not part of the default previewers:

```js
import {getTextPreview, getPDFPreview} from 'file-preview'

const previewers = [
  [o => o.file.type === 'application/pdf', getPDFPreview],
  [o => o.file.type === 'text/plain', getTextPreview]
]

widgets('file-preview', 'input[type="file"]', {on: 'load', previewers})
```

##### getTextPreview

Returns a `pre` tag with the file content.

##### getPDFPreview

Returns an `iframe` with the PDF file in its `src` attribute as a `data-uri`. This allow browsers with PDF display ability to render the PDF file without the need to bring a PDF2HTML library.
