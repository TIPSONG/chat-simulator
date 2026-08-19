// 事件绑定：把所有静态控件与动作函数连接起来。

import { state, save } from './state.js';
import { $, readImageFile, initial } from './utils.js';
import { renderPhoneHead, renderChat, applyBg, fitPhoneHeight, applyInputBar, updateMainHint, updateEditHint } from './render.js';
import { addOrUpdateCharacter, resetCharForm, setCharAvatar, clearCharAvatar, hasCharAvatar } from './characters.js';
import {
  setComposerType, addMessage, setMsgImage, clearMsgImage,
  setEditImage, clearEditImage, setEditType, renderEditImagePreview, saveEdit, closeEdit
} from './messages.js';
import { openCropModal, askImageChoice, closeCrop, closeImageChoice } from './crop.js';
import { copyText, exportJson, importJson, exportImage } from './export.js';
import { enterPlayMode } from './player.js';
import { loadDemo } from './data.js';
import { commitBubbleCss, resetBubbleCss } from './bubbleStyle.js';

// ---- 工具：节流 ----
function throttle(fn, wait) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) { last = now; fn.apply(this, args); }
  };
}

// ---- 工具：Toast 提示（替代部分 alert） ----
function showToast(msg, type) {
  let el = document.getElementById('appToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appToast';
    el.style.cssText = 'position:fixed;top:12px;right:12px;padding:10px 16px;border-radius:8px;font-size:13px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.2);transition:opacity .3s;opacity:0;';
    document.body.appendChild(el);
  }
  const bg = type === 'success' ? '#43a047' : (type === 'error' ? '#e53935' : '#333');
  el.style.background = bg;
  el.style.color = '#fff';
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

export function bindEvents() {
  // topbar
  $('titleInput').addEventListener('input', function () {
    state.meta.title = this.value.trim() || '群聊';
    renderPhoneHead(); save();
  });
  $('showTimeCheck').addEventListener('change', function () {
    state.meta.showTime = this.checked;
    renderChat(); save();
  });
  $('showInputBarCheck').addEventListener('change', function () {
    state.meta.showInputBar = this.checked;
    applyInputBar(); save();
  });
  $('bgSelect').addEventListener('change', function () {
    state.meta.bg = this.value;
    applyBg(); save();
  });
  $('autoHeightCheck').addEventListener('change', function () {
    state.meta.autoHeight = this.checked;
    fitPhoneHeight(); save();
  });
  $('bubbleCssApplyBtn').addEventListener('click', commitBubbleCss);
  $('bubbleCssResetBtn').addEventListener('click', resetBubbleCss);
  // window resize 节流
  window.addEventListener('resize', throttle(fitPhoneHeight, 150));
  $('copyTextBtn').addEventListener('click', copyText);
  $('exportJsonBtn').addEventListener('click', exportJson);
  $('exportImageBtn').addEventListener('click', exportImage);
  $('importJsonBtn').addEventListener('click', function () { $('importJsonInput').click(); });
  $('importJsonInput').addEventListener('change', function () {
    if (this.files && this.files[0]) importJson(this.files[0]);
    this.value = '';
  });
  $('loadDemoBtn').addEventListener('click', function () {
    if (state.messages.length && !confirm('载入示例将覆盖当前数据，确定吗？')) return;
    loadDemo();
  });
  $('playModeBtn').addEventListener('click', enterPlayMode);
  $('clearBtn').addEventListener('click', function () {
    if (!state.messages.length) return;
    if (confirm('确定清空全部消息吗？（人物保留）')) { state.messages = []; renderChat(); save(); }
  });

  // character form
  $('addCharBtn').addEventListener('click', function () {
    addOrUpdateCharacter().catch(e => console.error(e));
  });
  $('cancelCharEditBtn').addEventListener('click', resetCharForm);
  $('charName').addEventListener('input', function () {
    if (!hasCharAvatar()) {
      $('charAvatarPreview').textContent = initial(this.value || '?');
    }
  });
  $('charColor').addEventListener('input', function () {
    if (!hasCharAvatar()) $('charAvatarPreview').style.background = this.value;
  });
  $('charAvatarBtn').addEventListener('click', function () { $('charAvatarFile').click(); });
  $('charAvatarFile').addEventListener('change', function () {
    if (this.files && this.files[0]) {
      readImageFile(this.files[0], function (dataUrl) {
        openCropModal(dataUrl, setCharAvatar);
      });
    }
    this.value = '';
  });
  $('charAvatarClearBtn').addEventListener('click', clearCharAvatar);

  // composer
  $('typeSwitch').addEventListener('click', function (e) {
    const b = e.target.closest('.tp');
    if (b) setComposerType(b.getAttribute('data-type'));
  });
  $('addMsgBtn').addEventListener('click', function () {
    addMessage().catch(e => console.error(e));
  });
  $('msgText').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addMessage().catch(err => console.error(err)); }
  });
  $('msgImageBtn').addEventListener('click', function () { $('msgImageFile').click(); });
  $('msgImageFile').addEventListener('change', function () {
    if (this.files && this.files[0]) {
      readImageFile(this.files[0], function (dataUrl) {
        askImageChoice(dataUrl, setMsgImage);
      });
    }
    this.value = '';
  });
  $('msgImageRemoveBtn').addEventListener('click', clearMsgImage);

  // edit modal
  $('editTypeSwitch').addEventListener('click', function (e) {
    const b = e.target.closest('.tp');
    if (b) { setEditType(b.getAttribute('data-type')); renderEditImagePreview(); }
  });
  $('editSaveBtn').addEventListener('click', function () {
    saveEdit().catch(e => console.error(e));
  });
  $('editCancelBtn').addEventListener('click', closeEdit);
  $('editOverlay').addEventListener('click', function (e) { if (e.target === this) closeEdit(); });
  $('editImageBtn').addEventListener('click', function () { $('editImageFile').click(); });
  $('editImageFile').addEventListener('change', function () {
    if (this.files && this.files[0]) {
      readImageFile(this.files[0], function (dataUrl) {
        askImageChoice(dataUrl, setEditImage);
      });
    }
    this.value = '';
  });
  $('editImageRemoveBtn').addEventListener('click', clearEditImage);
  $('msgCharSelect').addEventListener('change', updateMainHint);
  $('editCharSelect').addEventListener('change', updateEditHint);

  // lightbox
  $('lightbox').addEventListener('click', function () { this.classList.add('hidden'); });

  // keyboard: esc 关闭弹窗 / 图片放大
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!$('lightbox').classList.contains('hidden')) $('lightbox').classList.add('hidden');
      else if (!$('editOverlay').classList.contains('hidden')) closeEdit();
      else if (!$('cropOverlay').classList.contains('hidden')) closeCrop();
      else if (!$('imgChoiceOverlay').classList.contains('hidden')) closeImageChoice();
    }
  });
}
