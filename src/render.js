// 渲染层：把 state 渲染成 DOM，并提供各类渲染入口。
//
// 注意：本模块与 characters.js / messages.js 存在「循环依赖」——
// render 里的按钮回调会调用 characters/messages 的动作函数，而它们又调回
// render（如 renderAll / renderChat）。ES 模块的 live binding 能正确处理这种
// 仅在函数体内发生的相互调用（顶层不求值对方导出），故可正常工作。

import { state, getChar, BGS } from './state.js';
import { $, buildAvatarEl } from './utils.js';
import { DEFAULT_BUBBLE_CSS, applyBubbleCss } from './bubbleStyle.js';
import { startEditCharacter, deleteCharacter } from './characters.js';
import { openEdit, deleteMessage, moveMessage } from './messages.js';

// 把 meta 回填到设置控件。
export function applyMetaFromState() {
  $('titleInput').value = state.meta.title;
  $('showTimeCheck').checked = !!state.meta.showTime;
  $('bgSelect').value = state.meta.bg || 'light';
  $('autoHeightCheck').checked = state.meta.autoHeight !== false;
  $('bubbleCssInput').value = state.meta.bubbleCss || DEFAULT_BUBBLE_CSS;
  $('showInputBarCheck').checked = state.meta.showInputBar !== false;
  applyBubbleCss();
  applyBg();
  fitPhoneHeight();
  applyInputBar();
}

// 应用聊天背景。
export function applyBg() {
  const bg = BGS[state.meta.bg] || BGS.light;
  $('chatArea').style.background = bg.css;
}

// 自适应对话高度开关。
export function fitPhoneHeight() {
  document.querySelector('.phone').classList.toggle('autoheight', state.meta.autoHeight !== false);
}

// 底部输入条显示/隐藏。
export function applyInputBar() {
  const bar = document.querySelector('.phone-inputbar');
  if (bar) bar.classList.toggle('hidden', state.meta.showInputBar === false);
}

// 全量重绘。
export function renderAll() {
  renderCharacterList();
  renderCharSelects();
  renderChat();
  renderPhoneHead();
  fitPhoneHeight();
}

// 手机顶部标题 / 成员数。
export function renderPhoneHead() {
  $('phoneTitle').textContent = state.meta.title || '群聊';
  $('phoneSub').textContent = state.characters.length + ' 位成员';
}

// 人物列表。
export function renderCharacterList() {
  const wrap = $('charList');
  wrap.innerHTML = '';
  if (state.characters.length === 0) {
    wrap.innerHTML = '<div class="empty">还没有人物，先在下方添加一个吧～</div>';
    return;
  }
  state.characters.forEach(function (ch) {
    const item = document.createElement('div');
    item.className = 'char-item' + (ch.isMain ? ' main' : '');

    item.appendChild(buildAvatarEl(ch, true));

    const info = document.createElement('div');
    info.className = 'info';
    const nm = document.createElement('div');
    nm.className = 'name';
    nm.textContent = ch.name || '(未命名)';
    if (ch.isMain) {
      const badge = document.createElement('span');
      badge.className = 'main-badge';
      badge.textContent = '主人物';
      nm.appendChild(badge);
    }
    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = ch.isMain ? '右侧显示（自己）' : (ch.avatar ? '自定义头像' : '默认头像');
    info.appendChild(nm); info.appendChild(sub);

    const mainBtn = document.createElement('button');
    mainBtn.className = 'btn small';
    mainBtn.textContent = ch.isMain ? '✓ 主人物' : '设为主人物';
    mainBtn.title = ch.isMain ? '当前主人物（显示在右侧）' : '点击将其设为主人物（显示在右侧）';
    mainBtn.disabled = !!ch.isMain;
    mainBtn.addEventListener('click', function () { setMainCharacter(ch.id); });

    const editBtn = document.createElement('button');
    editBtn.className = 'btn small';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', function () { startEditCharacter(ch.id); });

    const delBtn = document.createElement('button');
    delBtn.className = 'btn small danger';
    delBtn.textContent = '删除';
    delBtn.addEventListener('click', function () { deleteCharacter(ch.id); });

    item.appendChild(info);
    item.appendChild(mainBtn);
    item.appendChild(editBtn);
    item.appendChild(delBtn);
    wrap.appendChild(item);
  });
}

// 重填「说话人物」下拉框（编辑器 + 编辑弹窗）。
export function renderCharSelects() {
  fillCharSelect($('msgCharSelect'));
  fillCharSelect($('editCharSelect'));
  updateMainHint();
}

export function fillCharSelect(sel) {
  const prev = sel.value;
  sel.innerHTML = '';
  if (state.characters.length === 0) {
    const o = document.createElement('option');
    o.value = ''; o.textContent = '（请先添加人物）';
    sel.appendChild(o);
    return;
  }
  state.characters.forEach(function (ch) {
    const o = document.createElement('option');
    o.value = ch.id;
    o.textContent = (ch.name || '(未命名)') + (ch.isMain ? '（主人物）' : '');
    sel.appendChild(o);
  });
  if (prev && getChar(prev)) sel.value = prev;
}

export function updateMainHint() {
  const hint = $('msgMainHint');
  const ch = getChar($('msgCharSelect').value);
  if (!ch) { hint.textContent = ''; return; }
  hint.textContent = ch.isMain
    ? '✓ 主人物「' + ch.name + '」：将显示在右侧（自己发送）'
    : '普通成员：将显示在左侧';
}

export function updateEditHint() {
  const hint = $('editMainHint');
  const ch = getChar($('editCharSelect').value);
  if (!ch) { hint.textContent = ''; return; }
  hint.textContent = ch.isMain
    ? '✓ 主人物：将显示在右侧（自己发送）'
    : '普通成员：将显示在左侧';
}

export function setMainCharacter(id) {
  state.characters.forEach(function (c) { c.isMain = (c.id === id); });
  renderAll();
}

// ---- 聊天记录区：增量渲染优化 ----
// 用 DocumentFragment 批量插入，避免 innerHTML='' 全量重建。
// 同时复用已有 DOM 节点（通过 data-msg-id 匹配），减少 GC 与重排。

export function renderChat() {
  const area = $('chatArea');
  const messages = state.messages;

  if (messages.length === 0) {
    area.innerHTML = '<div class="empty">聊天记录为空，先在左侧添加内容吧～</div>';
    fitPhoneHeight();
    return;
  }

  // 1. 收集现有节点，建立 id -> node 映射
  const existing = new Map();
  Array.from(area.children).forEach(node => {
    const id = node.getAttribute('data-msg-id');
    if (id) existing.set(id, node);
  });

  // 2. 按顺序构建新 DOM 列表，复用已有节点
  const fragment = document.createDocumentFragment();
  const seenIds = new Set();
  let needsScroll = false;

  messages.forEach(function (m, idx) {
    seenIds.add(m.id);
    let el = existing.get(m.id);

    if (!el) {
      // 新增节点
      el = buildMessageEl(m, idx);
      needsScroll = true; // 有新内容时滚动到底部
    } else {
      // 已有节点：检查是否需要更新（如内容/时间/图片变了）
      if (el.getAttribute('data-msg-index') !== String(idx)) {
        // 索引变了（顺序调整），需要重建工具条
        const newEl = buildMessageEl(m, idx);
        el.replaceWith(newEl);
        el = newEl;
        needsScroll = true;
      } else {
        // 检查内容是否有变（文本、时间、图片宽度等）
        syncMessageContent(el, m);
      }
    }

    el.setAttribute('data-msg-id', m.id);
    el.setAttribute('data-msg-index', String(idx));
    fragment.appendChild(el);
  });

  // 3. 删除已不存在的节点
  existing.forEach((node, id) => {
    if (!seenIds.has(id)) node.remove();
  });

  // 4. 一次性替换
  area.innerHTML = '';
  area.appendChild(fragment);

  if (needsScroll) {
    area.scrollTop = area.scrollHeight;
  }
  fitPhoneHeight();
}

// 对已有 DOM 节点做轻量内容同步（不重建整个消息）。
function syncMessageContent(el, m) {
  if (m.type === 'narration' || m.type === 'special' || m.type === 'event') {
    const textEl = el.querySelector('.text, .msg-event');
    if (textEl && textEl.textContent !== m.text) textEl.textContent = m.text;
    return;
  }
  // message 类型
  const ch = getChar(m.characterId);
  const isMain = !!(ch && ch.isMain);

  // 同步文本
  const textEl = el.querySelector('.msg-text');
  if (textEl && textEl.textContent !== (m.text || '')) {
    textEl.textContent = m.text || '';
  }

  // 同步时间
  const timeEl = el.querySelector('.msg-time');
  if (state.meta.showTime && m.time) {
    if (timeEl) timeEl.textContent = m.time;
    else {
      const newTime = document.createElement('div');
      newTime.className = 'msg-time';
      newTime.textContent = m.time;
      const body = el.querySelector('.msg-body');
      if (body) body.appendChild(newTime);
    }
  } else if (timeEl) {
    timeEl.remove();
  }

  // 同步图片宽度
  if (m.image && m.imageW) {
    const img = el.querySelector('.msg-img');
    if (img) {
      img.style.width = m.imageW + 'px';
      img.style.height = 'auto';
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
    }
  }
}

// 一条消息（含悬浮工具条）。
export function buildMessageEl(m, idx) {
  let el;
  if (m.type === 'narration') el = buildNarrationEl(m);
  else if (m.type === 'special') el = buildSpecialEventEl(m);
  else if (m.type === 'event') el = buildEventEl(m);
  else el = buildChatBubbleEl(m);

  const tools = document.createElement('div');
  tools.className = 'msg-tools';
  tools.appendChild(toolBtn('↑', idx > 0, function () { moveMessage(idx, -1); }));
  tools.appendChild(toolBtn('↓', idx < state.messages.length - 1, function () { moveMessage(idx, 1); }));
  tools.appendChild(toolBtn('编辑', true, function () { openEdit(m.id); }));
  tools.appendChild(toolBtn('删', true, function () { deleteMessage(m.id); }, true));
  el.appendChild(tools);

  return el;
}

export function toolBtn(label, enabled, fn, danger) {
  const b = document.createElement('button');
  b.className = 'tbtn' + (danger ? ' del' : '');
  b.textContent = label;
  b.disabled = !enabled;
  b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
  return b;
}

// 人物对话气泡（含图片 + 拖拽缩放）。
export function buildChatBubbleEl(m) {
  const ch = getChar(m.characterId);
  const isMain = !!(ch && ch.isMain);
  const name = ch ? ch.name : '未知角色';

  const row = document.createElement('div');
  row.className = 'msg-row' + (isMain ? ' right' : '');

  row.appendChild(buildAvatarEl(ch, true));

  const body = document.createElement('div');
  body.className = 'msg-body';

  if (!isMain) {
    const nm = document.createElement('div');
    nm.className = 'msg-name';
    nm.textContent = name;
    body.appendChild(nm);
  }

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (m.text) {
    const t = document.createElement('div');
    t.className = 'msg-text';
    t.textContent = m.text;
    bubble.appendChild(t);
  }
  if (m.image) {
    const wrap = document.createElement('div');
    wrap.className = 'msg-img-wrap';
    const img = document.createElement('img');
    img.className = 'msg-img';
    img.src = m.image;
    if (m.imageW) {
      img.style.width = m.imageW + 'px';
      img.style.height = 'auto';
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
    }
    img.addEventListener('click', function () { openLightbox(m.image); });
    const handle = document.createElement('span');
    handle.className = 'msg-img-resize';
    handle.title = '拖拽调整图片大小';
    wrap.appendChild(img);
    wrap.appendChild(handle);
    attachImageResize(handle, img, m);
    bubble.appendChild(wrap);
  }
  body.appendChild(bubble);

  if (state.meta.showTime && m.time) {
    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = m.time;
    body.appendChild(time);
  }

  row.appendChild(body);
  return row;
}

// 图片右下角拖拽缩放手柄。
export function attachImageResize(handle, img, m) {
  const MIN = 48, MAX = 260;
  let startX = 0, startW = 0, curW = 0, active = false;
  handle.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    e.stopPropagation();
    active = true;
    startX = e.clientX;
    startW = img.getBoundingClientRect().width;
    curW = startW;
    try { if (handle.setPointerCapture) handle.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  handle.addEventListener('pointermove', function (e) {
    if (!active) return;
    const w = Math.max(MIN, Math.min(MAX, Math.round(startW + (e.clientX - startX))));
    curW = w;
    img.style.width = w + 'px';
    img.style.height = 'auto';
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
  });
  function endResize() {
    if (!active) return;
    active = false;
    m.imageW = Math.round(curW);
  }
  handle.addEventListener('pointerup', endResize);
  handle.addEventListener('pointercancel', endResize);
}

export function buildNarrationEl(m) {
  const el = document.createElement('div');
  el.className = 'msg-narration';
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = '旁白';
  const t = document.createElement('span');
  t.className = 'text';
  t.textContent = m.text;
  el.appendChild(tag);
  el.appendChild(t);
  return el;
}

export function buildEventEl(m) {
  const el = document.createElement('div');
  el.className = 'msg-event';
  el.textContent = m.text;
  return el;
}

export function buildSpecialEventEl(m) {
  const el = document.createElement('div');
  el.className = 'msg-special';
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = '❤️ 特殊事件';
  const t = document.createElement('span');
  t.className = 'text';
  t.textContent = m.text;
  el.appendChild(tag);
  el.appendChild(t);
  return el;
}

// 图片放大查看。
export function openLightbox(src) {
  const lb = $('lightbox');
  lb.innerHTML = '';
  const img = document.createElement('img');
  img.src = src;
  lb.appendChild(img);
  lb.classList.remove('hidden');
}

// 填充背景下拉框。
export function populateBgSelect() {
  const sel = $('bgSelect');
  sel.innerHTML = '';
  Object.keys(BGS).forEach(function (key) {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = BGS[key].label;
    sel.appendChild(o);
  });
}
