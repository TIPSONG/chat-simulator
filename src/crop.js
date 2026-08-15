// 裁剪弹窗（头像圆形 / 图片矩形）与「是否裁剪」选择弹窗。
// 本模块只依赖 utils，不依赖 render，避免额外的循环依赖。

import { $ } from './utils.js';

const cropState = {
  img: null, dataUrl: '', SW: 300, SH: 300, aspect: 1, circle: true,
  coverScale: 1, zoom: 1, offsetX: 0, offsetY: 0, maxZoom: 4,
  dragging: false, lastX: 0, lastY: 0, onConfirm: null
};

// 等待「是否裁剪」决策的消息图片。
let pendingImage = null;
let pendingImageApply = null;

export function openCropModal(dataUrl, onConfirm, opts) {
  opts = opts || {};
  cropState.aspect = opts.aspect || 1;
  cropState.circle = opts.circle !== false;
  cropState.onConfirm = onConfirm;
  cropState.dataUrl = dataUrl;
  $('cropTitle').textContent = cropState.circle ? '裁剪头像' : '裁剪图片';
  $('cropHint').textContent = cropState.circle
    ? '拖动图片调整位置，滚轮或滑块缩放。圆形内区域将作为头像显示。'
    : '拖动图片调整位置，滚轮或滑块缩放。框内区域将作为图片保留。';
  const img = new Image();
  img.onload = function () {
    cropState.img = img;
    $('cropImg').src = dataUrl;
    cropState.zoom = 1;
    cropState.offsetX = 0;
    cropState.offsetY = 0;
    $('cropStage').style.aspectRatio = String(cropState.aspect);
    $('cropStage').style.width = '300px';
    $('cropStage').style.height = 'auto';
    $('cropMask').style.display = cropState.circle ? '' : 'none';
    $('cropRing').classList.toggle('rect', !cropState.circle);
    $('cropOverlay').classList.remove('hidden');
    cropState.SW = $('cropStage').clientWidth;
    cropState.SH = $('cropStage').clientHeight;
    cropState.coverScale = Math.max(cropState.SW / img.naturalWidth, cropState.SH / img.naturalHeight);
    $('cropZoomRange').value = 1;
    applyCropTransform();
  };
  img.onerror = function () { alert('图片加载失败，请更换图片'); };
  img.src = dataUrl;
}

function applyCropTransform() {
  const imgEl = $('cropImg');
  const W = cropState.img.naturalWidth;
  const H = cropState.img.naturalHeight;
  const s = cropState.coverScale * cropState.zoom;
  const dw = W * s, dh = H * s;
  const SW = cropState.SW, SH = cropState.SH;
  imgEl.style.width = dw + 'px';
  imgEl.style.height = dh + 'px';
  imgEl.style.left = ((SW - dw) / 2 + cropState.offsetX) + 'px';
  imgEl.style.top = ((SH - dh) / 2 + cropState.offsetY) + 'px';
}

function clampCropOffsets() {
  const W = cropState.img.naturalWidth;
  const H = cropState.img.naturalHeight;
  const s = cropState.coverScale * cropState.zoom;
  const maxX = (W * s - cropState.SW) / 2;
  const maxY = (H * s - cropState.SH) / 2;
  cropState.offsetX = Math.max(-maxX, Math.min(maxX, cropState.offsetX));
  cropState.offsetY = Math.max(-maxY, Math.min(maxY, cropState.offsetY));
}

function setCropZoom(z) {
  const oldS = cropState.coverScale * cropState.zoom;
  cropState.zoom = Math.max(1, Math.min(cropState.maxZoom, z));
  const newS = cropState.coverScale * cropState.zoom;
  cropState.offsetX *= (newS / oldS);
  cropState.offsetY *= (newS / oldS);
  clampCropOffsets();
  $('cropZoomRange').value = cropState.zoom;
  applyCropTransform();
}

function confirmCrop() {
  const W = cropState.img.naturalWidth;
  const H = cropState.img.naturalHeight;
  const s = cropState.coverScale * cropState.zoom;
  const SW = cropState.SW, SH = cropState.SH;
  const left = (SW - W * s) / 2 + cropState.offsetX;
  const top = (SH - H * s) / 2 + cropState.offsetY;
  let srcX = -left / s;
  let srcY = -top / s;
  const srcW = SW / s;
  const srcH = SH / s;
  srcX = Math.max(0, Math.min(W - srcW, srcX));
  srcY = Math.max(0, Math.min(H - srcH, srcY));
  let OUT_W, OUT_H;
  if (cropState.aspect >= 1) { OUT_W = 1200; OUT_H = Math.round(1200 / cropState.aspect); }
  else { OUT_H = 1200; OUT_W = Math.round(1200 * cropState.aspect); }
  const canvas = document.createElement('canvas');
  canvas.width = OUT_W; canvas.height = OUT_H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(cropState.img, srcX, srcY, srcW, srcH, 0, 0, OUT_W, OUT_H);
  const result = canvas.toDataURL('image/png');
  const cb = cropState.onConfirm;
  closeCrop();
  if (cb) cb(result);
}

export function closeCrop() {
  $('cropOverlay').classList.add('hidden');
  cropState.img = null;
  cropState.onConfirm = null;
}

// 询问是否裁剪刚选中的消息图片。
export function askImageChoice(dataUrl, onApply) {
  pendingImage = dataUrl;
  pendingImageApply = onApply;
  $('imgChoicePreview').src = dataUrl;
  $('imgChoiceOverlay').classList.remove('hidden');
}

function applyPendingImage(result) {
  const fn = pendingImageApply;
  pendingImage = null;
  pendingImageApply = null;
  if (fn) fn(result);
}

export function closeImageChoice() {
  $('imgChoiceOverlay').classList.add('hidden');
  pendingImage = null;
  pendingImageApply = null;
}

export function bindCropEvents() {
  const stage = $('cropStage');
  stage.addEventListener('pointerdown', function (e) {
    cropState.dragging = true;
    cropState.lastX = e.clientX;
    cropState.lastY = e.clientY;
    if (stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
    stage.classList.add('grabbing');
    e.preventDefault();
  });
  stage.addEventListener('pointermove', function (e) {
    if (!cropState.dragging) return;
    const dx = e.clientX - cropState.lastX;
    const dy = e.clientY - cropState.lastY;
    cropState.lastX = e.clientX;
    cropState.lastY = e.clientY;
    cropState.offsetX += dx;
    cropState.offsetY += dy;
    clampCropOffsets();
    applyCropTransform();
  });
  function endDrag() { cropState.dragging = false; stage.classList.remove('grabbing'); }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    setCropZoom(cropState.zoom + (e.deltaY > 0 ? -0.1 : 0.1));
  }, { passive: false });

  $('cropZoomRange').addEventListener('input', function () { setCropZoom(parseFloat(this.value)); });
  $('cropZoomInBtn').addEventListener('click', function () { setCropZoom(cropState.zoom + 0.15); });
  $('cropZoomOutBtn').addEventListener('click', function () { setCropZoom(cropState.zoom - 0.15); });
  $('cropConfirmBtn').addEventListener('click', confirmCrop);
  $('cropCancelBtn').addEventListener('click', closeCrop);
  $('cropOverlay').addEventListener('click', function (e) { if (e.target === this) closeCrop(); });

  // 图片处理选择弹窗
  $('imgChoiceOriginalBtn').addEventListener('click', function () {
    const r = pendingImage;
    $('imgChoiceOverlay').classList.add('hidden');
    applyPendingImage(r);
  });
  $('imgChoiceSquareBtn').addEventListener('click', function () {
    const r = pendingImage;
    $('imgChoiceOverlay').classList.add('hidden');
    openCropModal(r, applyPendingImage, { aspect: 1, circle: false });
  });
  $('imgChoiceRectBtn').addEventListener('click', function () {
    const r = pendingImage;
    $('imgChoiceOverlay').classList.add('hidden');
    openCropModal(r, applyPendingImage, { aspect: 4 / 3, circle: false });
  });
  $('imgChoiceCancelBtn').addEventListener('click', closeImageChoice);
  $('imgChoiceOverlay').addEventListener('click', function (e) { if (e.target === this) closeImageChoice(); });
}
