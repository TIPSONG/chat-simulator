// 应用入口：加载样式、绑定事件、初始化界面。

import './style.css';
<<<<<<< HEAD
import { state, load } from './state.js';
=======
import { state, STORAGE_KEY } from './state.js';
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
import { populateBgSelect, applyMetaFromState, renderAll } from './render.js';
import { resetCharForm } from './characters.js';
import { setComposerType } from './messages.js';
import { bindCropEvents } from './crop.js';
import { bindEvents } from './events.js';
import { loadDemo } from './data.js';

<<<<<<< HEAD
async function init() {
  populateBgSelect();
  bindEvents();
  bindCropEvents();
  setComposerType('message');
  resetCharForm();

  const loaded = await load();
  if (!loaded || (state.characters.length === 0 && state.messages.length === 0)) {
=======
// 从 localStorage 恢复数据；空则载入示例。
function load() {
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.messages) && Array.isArray(data.characters)) {
        state.characters = data.characters;
        state.messages = data.messages;
        if (data.meta) {
          state.meta = {
            title: data.meta.title || '群聊',
            showTime: data.meta.showTime !== false,
            bg: data.meta.bg || 'light',
            autoHeight: data.meta.autoHeight !== false,
            bubbleCss: data.meta.bubbleCss || '',
            showInputBar: data.meta.showInputBar !== false
          };
        }
      }
    } catch (e) { /* 数据损坏则回退到示例 */ }
  }
  if (state.characters.length === 0 && state.messages.length === 0) {
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
    loadDemo();
    return;
  }
  applyMetaFromState();
  renderAll();
}

<<<<<<< HEAD
init();
=======
// 初始化流程
populateBgSelect();
bindEvents();
bindCropEvents();
setComposerType('message');
resetCharForm();
load();
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
