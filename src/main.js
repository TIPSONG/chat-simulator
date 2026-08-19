// 应用入口：加载样式、绑定事件、初始化界面。

import './style.css';
import { state, load } from './state.js';
import { populateBgSelect, applyMetaFromState, renderAll } from './render.js';
import { resetCharForm } from './characters.js';
import { setComposerType } from './messages.js';
import { bindCropEvents } from './crop.js';
import { bindEvents } from './events.js';
import { loadDemo } from './data.js';

async function init() {
  populateBgSelect();
  bindEvents();
  bindCropEvents();
  setComposerType('message');
  resetCharForm();

  const loaded = await load();
  if (!loaded || (state.characters.length === 0 && state.messages.length === 0)) {
    loadDemo();
    return;
  }
  applyMetaFromState();
  renderAll();
}

init();
