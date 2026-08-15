// 应用入口：加载样式、绑定事件、初始化界面。

import './style.css';
import { state, STORAGE_KEY } from './state.js';
import { populateBgSelect, applyMetaFromState, renderAll } from './render.js';
import { resetCharForm } from './characters.js';
import { setComposerType } from './messages.js';
import { bindCropEvents } from './crop.js';
import { bindEvents } from './events.js';
import { loadDemo } from './data.js';

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
    loadDemo();
    return;
  }
  applyMetaFromState();
  renderAll();
}

// 初始化流程
populateBgSelect();
bindEvents();
bindCropEvents();
setComposerType('message');
resetCharForm();
load();
