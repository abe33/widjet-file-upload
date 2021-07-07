import {CompositeDisposable, DisposableEvent} from 'widjet-disposables';
import {getNode, cloneNode, detachNode, parents} from 'widjet-utils';

const px = (v) => `${v}px`;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const hasFixedParent = (node) => parents(node).some((n) => window.getComputedStyle(n).position === 'fixed');
const getBoundingScreenRect = (node) => {
  let bounds = node.getBoundingClientRect();
  if (hasFixedParent(node)) {
    bounds = {
      left: bounds.left + document.body.scrollLeft + document.documentElement.scrollLeft,
      right: bounds.right + document.body.scrollLeft + document.documentElement.scrollLeft,
      top: bounds.top + document.body.scrollTop + document.documentElement.scrollTop,
      bottom: bounds.bottom + document.body.scrollTop + document.documentElement.scrollTop,
      width: bounds.width,
      height: bounds.height,
    };
  }
  return bounds;
};

export function editVersion(source, version) {
  return new Promise((resolve, reject) => {
    const editor = new VersionEditor(source, version);
    editor.onSave = () => {
      console.log('on save');
      const box = editor.getVersionBox();
      console.log(editor.element);
      detachNode(editor.element);
      editor.dispose();
      resolve(box);
    };
    editor.onCancel = () => {
      detachNode(editor.element);
      editor.dispose();
      reject();
    };

    document.body.appendChild(editor.element);
    editor.init();
  });
}

export default class VersionEditor {
  constructor(source, version) {
    const node = getNode(`
      <div class="version-editor">
        <div class="version-preview">
          <div class="version-box">
            <div class="drag-box"></div>
            <div class="top-handle"></div>
            <div class="left-handle"></div>
            <div class="bottom-handle"></div>
            <div class="right-handle"></div>
            <div class="top-left-handle"></div>
            <div class="top-right-handle"></div>
            <div class="bottom-left-handle"></div>
            <div class="bottom-right-handle"></div>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="cancel"><span>Cancel</span></button>
          <button type="button" class="save"><span>Save</span></button>
        </div>
      </div>
      `);

    const box = node.querySelector('.version-box');
    const container = node.querySelector('.version-preview');
    const clone = cloneNode(source);
    container.insertBefore(clone, container.firstElementChild);

    this.source = source;
    this.clone = clone;
    this.version = version;
    this.element = node;
    this.box = box;
    this.container = container;
  }

  init() {
    const cancelButton = this.element.querySelector('.cancel');
    const saveButton = this.element.querySelector('.save');
    this.boxToPreview(this.version.getBox(this.source));

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(new DisposableEvent(saveButton, 'click', () => {
      this.onSave && this.onSave();
    }));

    this.subscriptions.add(new DisposableEvent(cancelButton, 'click', () => {
      this.onCancel && this.onCancel();
    }));

    this.subscribeToDragBox();
  }

  dispose() {
    this.subscriptions.dispose();
  }

  getVersionBox() {
    const scale = this.getScale();
    return [
      this.box.offsetLeft / scale,
      this.box.offsetTop / scale,
      this.box.offsetWidth / scale,
      this.box.offsetHeight / scale,
    ];
  }

  boxToPreview(boxData) {
    const scale = this.getScale();
    this.updateBox(
      boxData[0] * scale,
      boxData[1] * scale,
      boxData[2] * scale,
      boxData[3] * scale
    );
  }

  getScale() {
    // In safari, the width retrieved won't be the one we're seeing
    // unless we're calling getComputedStyle to force a redraw.
    const width = parseInt(window.getComputedStyle(this.clone), 10);
    return width / this.source.naturalWidth;
  }

  updateBox(left, top, width, height) {
    this.box.classList.toggle('upsampling', width < this.version.width || height < this.version.height);
    this.box.style.cssText = `
      left: ${px(left)};
      top: ${px(top)};
      width: ${px(width)};
      height: ${px(height)};
    `;
  }

  subscribeToDragBox() {
    this.dragGesture('.drag-box', (data) => {
      const {containerBounds: b, handleBounds: hb, mouseX, mouseY} = data;

      this.box.style.left = px(clamp(mouseX, 0, b.width - hb.width));
      this.box.style.top = px(clamp(mouseY, 0, b.height - hb.height));
    });

    this.dragGesture('.top-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, mouseY,
      } = data;

      const y = mouseY + (hb.height / 2);
      const ratio = this.version.getRatio();
      const center = bb.left + bb.width / 2;
      let newHeight = bb.bottom - y;
      let newWidth = newHeight * ratio;

      [newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight,
      ], [
        Math.min(center * 2, (b.width - center) * 2),
        bb.bottom,
      ]);

      this.updateBox(
        center - newWidth / 2,
        clamp(bb.bottom - newHeight, 0, b.height),
        newWidth,
        newHeight
      );
    });

    this.dragGesture('.bottom-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, mouseY,
      } = data;

      const y = mouseY + (hb.height / 2);
      const ratio = this.version.getRatio();
      const center = bb.left + bb.width / 2;
      let newHeight = y - bb.top;
      let newWidth = newHeight * ratio;

      [newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight,
      ], [
        Math.min(center * 2, (b.width - center) * 2),
        b.height - bb.top,
      ]);

      this.updateBox(
        center - newWidth / 2,
        bb.top,
        newWidth,
        newHeight
      );
    });

    this.dragGesture('.left-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, mouseX,
      } = data;

      const x = mouseX + (hb.width / 2);
      const ratio = this.version.getRatio();
      const center = bb.top + bb.height / 2;
      let newWidth = bb.right - x;
      let newHeight = newWidth / ratio;

      [newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight,
      ], [
        bb.right,
        Math.min(center * 2, (b.height - center) * 2),
      ]);

      this.updateBox(
        clamp(bb.right - newWidth, 0, b.width),
        center - newHeight / 2,
        newWidth,
        newHeight
      );
    });

    this.dragGesture('.right-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, mouseX,
      } = data;

      const x = mouseX + (hb.width / 2);
      const ratio = this.version.getRatio();
      const center = bb.top + bb.height / 2;
      let newWidth = x - bb.left;
      let newHeight = newWidth / ratio;

      [newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight,
      ], [
        b.width - bb.left,
        Math.min(center * 2, (b.height - center) * 2),
      ]);

      this.updateBox(
        bb.left,
        center - newHeight / 2,
        newWidth,
        newHeight
      );
    });

    this.dragGesture('.top-left-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, mouseX,
      } = data;

      const x = mouseX + (hb.width / 2);
      const ratio = this.version.getRatio();
      let newWidth = bb.right - x;
      let newHeight = newWidth / ratio;

      [newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight,
      ], [
        bb.right, bb.bottom,
      ]);

      this.updateBox(
        clamp(bb.right - newWidth, 0, b.width),
        clamp(bb.bottom - newHeight, 0, b.height),
        newWidth,
        newHeight
      );
    });

    this.dragGesture('.top-right-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, mouseX,
      } = data;

      const x = mouseX + (hb.width / 2);
      const ratio = this.version.getRatio();
      let newWidth = x - bb.left;
      let newHeight = newWidth / ratio;

      [newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight,
      ], [
        b.width - bb.left, b.bottom,
      ]);

      this.updateBox(
        bb.left,
        clamp(bb.bottom - newHeight, 0, b.height),
        newWidth,
        newHeight
      );
    });

    this.dragGesture('.bottom-left-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, mouseX,
      } = data;

      const x = mouseX + (hb.width / 2);
      const ratio = this.version.getRatio();
      let newWidth = bb.right - x;
      let newHeight = newWidth / ratio;

      [newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight,
      ], [
        bb.right, b.height - bb.top,
      ]);

      this.updateBox(
        clamp(bb.right - newWidth, 0, b.width),
        bb.top,
        newWidth,
        newHeight
      );
    });

    this.dragGesture('.bottom-right-handle', (data) => {
      const {
        containerBounds: b, handleBounds: hb, boxBounds: bb, mouseX,
      } = data;

      const x = mouseX + (hb.width / 2);
      const ratio = this.version.getRatio();
      let newWidth = x - bb.left;
      let newHeight = newWidth / ratio;

      [newWidth, newHeight] = this.contraintBoxSize([
        newWidth, newHeight,
      ], [
        b.width - bb.left, b.height - bb.top,
      ]);

      this.updateBox(
        bb.left,
        bb.top,
        newWidth,
        newHeight
      );
    });

    this.dragGesture('img', (data) => {
      const {
        containerBounds: b, offsetX, offsetY, mouseX,
      } = data;

      const ratio = this.version.getRatio();
      const targetX = mouseX + offsetX;

      if (targetX < offsetX) {
        let newWidth = offsetX - targetX;
        let newHeight = newWidth / ratio;

        [newWidth, newHeight] = this.contraintBoxSize([
          newWidth, newHeight,
        ], [
          offsetX, offsetY,
        ]);

        this.updateBox(
          targetX,
          offsetY - newHeight,
          newWidth,
          newHeight
        );
      } else {
        let newWidth = targetX - offsetX;
        let newHeight = newWidth / ratio;

        [newWidth, newHeight] = this.contraintBoxSize([
          newWidth, newHeight,
        ], [
          b.width - offsetX, b.height - offsetY,
        ]);

        this.updateBox(
          offsetX,
          offsetY,
          newWidth,
          newHeight
        );
      }
    });
  }

  contraintBoxSize([width, height], [maxWidth, maxHeight]) {
    const ratio = this.version.getRatio();

    if (width > maxWidth) {
      width = maxWidth;
      height = width / ratio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }

    return [width, height];
  }

  dragGesture(selector, handler) {
    const target = this.element.querySelector(selector);
    this.subscriptions.add(new DisposableEvent(target, 'mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const dragSubs = new CompositeDisposable();
      const handleBounds = getBoundingScreenRect(target);
      let containerBounds = getBoundingScreenRect(this.container);
      const offsetX = e.pageX - handleBounds.left;
      const offsetY = e.pageY - handleBounds.top;
      const boxBounds = {
        top: this.box.offsetTop,
        left: this.box.offsetLeft,
        width: this.box.offsetWidth,
        height: this.box.offsetHeight,
        right: this.box.offsetLeft + this.box.offsetWidth,
        bottom: this.box.offsetTop + this.box.offsetHeight,
      };

      dragSubs.add(new DisposableEvent(document.body, 'mousemove', (e) => {
        e.preventDefault();
        e.stopPropagation();

        handler({
          containerBounds,
          boxBounds,
          handleBounds: {
            top: target.offsetTop,
            left: target.offsetLeft,
            width: target.offsetWidth,
            height: target.offsetHeight,
            right: target.offsetLeft + target.offsetWidth,
            bottom: target.offsetTop + target.offsetHeight,
          },
          offsetX, offsetY,
          pageX: e.pageX,
          pageY: e.pageY,
          mouseX: e.pageX - (containerBounds.left + offsetX),
          mouseY: e.pageY - (containerBounds.top + offsetY),
        });
      }));

      dragSubs.add(new DisposableEvent(document.body, 'mouseup', (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.subscriptions.remove(dragSubs);
        dragSubs.dispose();
      }));

      this.subscriptions.add(dragSubs);
    }));
  }
}
