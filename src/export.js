// 导入 / 导出 / 复制文本 / 导出图片。

import html2canvas from 'html2canvas';
import { state, getChar, save, prepareImportedState, resolveStateForExport } from './state.js';
import { $, download } from './utils.js';
import { applyMetaFromState, renderAll } from './render.js';

// 导出项目 JSON（图片已解析为 Data URL）。
export async function exportJson() {
  const resolved = resolveStateForExport();
  download('对话模拟器-' + (state.meta.title || '项目') + '.json', JSON.stringify(resolved, null, 2), 'application/json');
}

// 导入项目 JSON。
export async function importJson(file) {
  const r = new FileReader();
  r.onload = async function () {
    try {
      const data = JSON.parse(r.result);
      if (!data || !Array.isArray(data.messages) || !Array.isArray(data.characters)) {
        alert('文件格式不正确：缺少 characters / messages 字段'); return;
      }

      // schema 基础校验
      const charErrors = validateCharacters(data.characters);
      const msgErrors = validateMessages(data.messages, data.characters);
      if (charErrors.length || msgErrors.length) {
        const lines = [];
        if (charErrors.length) lines.push('人物数据问题：\n' + charErrors.slice(0, 5).join('\n'));
        if (msgErrors.length) lines.push('消息数据问题：\n' + msgErrors.slice(0, 5).join('\n'));
        if (!confirm('检测到数据异常（共 ' + (charErrors.length + msgErrors.length) + ' 处），是否继续导入？\n\n' + lines.join('\n\n'))) {
          return;
        }
      }

      // 兜底：清理非法字段，确保兼容性
      sanitizeData(data);

      // 把导入的 Data URL 图片迁移到 IndexedDB
      await prepareImportedState(data);

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
      applyMetaFromState();
      renderAll();
      await save();
      showToast('导入成功', 'success');
    } catch (e) {
      alert('导入失败：' + e.message);
    }
  };
  r.readAsText(file);
}

function validateCharacters(arr) {
  const errs = [];
  if (!Array.isArray(arr)) { errs.push('characters 不是数组'); return errs; }
  const seen = new Set();
  for (let i = 0; i < arr.length; i++) {
    const c = arr[i];
    if (!c || typeof c !== 'object') { errs.push('第 ' + i + ' 项不是对象'); continue; }
    if (typeof c.id !== 'string' || !c.id) errs.push('第 ' + i + ' 个人物缺少 id');
    else if (seen.has(c.id)) errs.push('第 ' + i + ' 个人物 id 重复：' + c.id);
    else seen.add(c.id);
    if (typeof c.name !== 'string') errs.push('第 ' + i + ' 个人物 name 类型错误');
    if (c.avatar !== undefined && typeof c.avatar !== 'string') errs.push('第 ' + i + ' 个人物 avatar 类型错误');
    if (c.avatarRef !== undefined && typeof c.avatarRef !== 'string') errs.push('第 ' + i + ' 个人物 avatarRef 类型错误');
  }
  return errs;
}

function validateMessages(arr, chars) {
  const errs = [];
  if (!Array.isArray(arr)) { errs.push('messages 不是数组'); return errs; }
  const charIds = new Set((chars || []).map(c => c.id));
  for (let i = 0; i < arr.length; i++) {
    const m = arr[i];
    if (!m || typeof m !== 'object') { errs.push('第 ' + i + ' 条消息不是对象'); continue; }
    if (typeof m.id !== 'string' || !m.id) errs.push('第 ' + i + ' 条消息缺少 id');
    const validTypes = ['message', 'narration', 'special', 'event'];
    if (!validTypes.includes(m.type)) errs.push('第 ' + i + ' 条消息 type 非法：' + m.type);
    if (m.type === 'message') {
      if (typeof m.characterId !== 'string' || !m.characterId) {
        errs.push('第 ' + i + ' 条对话消息缺少 characterId');
      } else if (!charIds.has(m.characterId)) {
        errs.push('第 ' + i + ' 条对话消息引用了不存在的人物：' + m.characterId);
      }
    }
    if (m.image !== undefined && typeof m.image !== 'string') errs.push('第 ' + i + ' 条消息 image 类型错误');
    if (m.imageRef !== undefined && typeof m.imageRef !== 'string') errs.push('第 ' + i + ' 条消息 imageRef 类型错误');
  }
  return errs;
}

function sanitizeData(data) {
  // 清理 characters
  if (data.characters) {
    data.characters = data.characters.filter(c => c && typeof c === 'object' && typeof c.id === 'string');
    data.characters.forEach(c => {
      c.name = (typeof c.name === 'string') ? c.name : '未命名';
      if (c.color && typeof c.color !== 'string') delete c.color;
      if (c.avatar && typeof c.avatar !== 'string') delete c.avatar;
      if (c.avatarRef && typeof c.avatarRef !== 'string') delete c.avatarRef;
      if (typeof c.isMain !== 'boolean') c.isMain = !!c.isMain;
    });
  }
  // 清理 messages
  if (data.messages) {
    data.messages = data.messages.filter(m => m && typeof m === 'object' && typeof m.id === 'string');
    data.messages.forEach(m => {
      const validTypes = ['message', 'narration', 'special', 'event'];
      if (!validTypes.includes(m.type)) m.type = 'event';
      if (typeof m.text !== 'string') m.text = '';
      if (m.image && typeof m.image !== 'string') delete m.image;
      if (m.imageRef && typeof m.imageRef !== 'string') delete m.imageRef;
      if (m.type !== 'message') {
        delete m.characterId;
        delete m.image;
        delete m.imageRef;
      }
    });
  }
  // 清理 meta
  if (data.meta && typeof data.meta !== 'object') data.meta = {};
}

// 导出聊天为图片（html2canvas，已本地打包，无需联网）。
export function exportImage() {
  if (typeof html2canvas !== 'function') {
    alert('图片导出组件加载失败，请刷新页面重试。');
    return;
  }
  const phone = document.querySelector('.phone');
  const body = $('chatArea');
  const preview = document.querySelector('.preview');
  const main = document.querySelector('.main');
  const prevMaxH = phone.style.maxHeight;
  const prevOv = body.style.overflowY;
  const prevPreviewOv = preview.style.overflow;
  const prevMainOv = main.style.overflow;
  phone.classList.add('exporting');
  if (state.meta.autoHeight !== false) {
    phone.style.maxHeight = 'none';
    body.style.overflowY = 'visible';
    preview.style.overflow = 'visible';
    main.style.overflow = 'visible';
  }
  html2canvas(phone, { backgroundColor: null, scale: 2, useCORS: true }).then(function (canvas) {
    phone.classList.remove('exporting');
    phone.style.maxHeight = prevMaxH;
    body.style.overflowY = prevOv;
    preview.style.overflow = prevPreviewOv;
    main.style.overflow = prevMainOv;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = '对话模拟器-' + (state.meta.title || '截图') + '.png';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
  }).catch(function (e) {
    phone.classList.remove('exporting');
    phone.style.maxHeight = prevMaxH;
    body.style.overflowY = prevOv;
    preview.style.overflow = prevPreviewOv;
    main.style.overflow = prevMainOv;
    alert('导出图片失败：' + e.message);
  });
}

// 复制全部对话为纯文本。
export function copyText() {
  const lines = [];
  state.messages.forEach(function (m) {
    if (m.type === 'event') lines.push('【' + m.text + '】');
    else if (m.type === 'narration') lines.push('（旁白）' + m.text);
    else if (m.type === 'special') lines.push('（❤️ 特殊事件）' + m.text);
    else {
      const ch = getChar(m.characterId);
      const name = ch ? ch.name : '未知角色';
      lines.push(name + '：' + (m.text || '') + (m.image ? ' [图片]' : ''));
    }
  });
  const text = lines.join('\n');
  if (!text) { alert('当前没有可复制的对话'); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { showToast('已复制到剪贴板', 'success'); })
      .catch(function () { fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
}

export function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('已复制到剪贴板', 'success'); }
  catch (e) { alert('复制失败，请手动复制：\n\n' + text); }
  document.body.removeChild(ta);
}

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
