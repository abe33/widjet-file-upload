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
```
