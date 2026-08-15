// 导入 / 导出 / 复制文本 / 导出图片。

import { state, getChar, save } from './state.js';
import { $, download } from './utils.js';
import { applyMetaFromState, renderAll } from './render.js';

// 导出项目 JSON。
export function exportJson() {
  download('对话模拟器-' + (state.meta.title || '项目') + '.json', JSON.stringify(state, null, 2), 'application/json');
}

// 导入项目 JSON。
export function importJson(file) {
  const r = new FileReader();
  r.onload = function () {
    try {
      const data = JSON.parse(r.result);
      if (!data || !Array.isArray(data.messages) || !Array.isArray(data.characters)) {
        alert('文件格式不正确：缺少 characters / messages 字段'); return;
      }
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
      save();
    } catch (e) {
      alert('导入失败：' + e.message);
    }
  };
  r.readAsText(file);
}

// 导出聊天为图片（html2canvas，CDN 加载）。
export function exportImage() {
  if (typeof window.html2canvas !== 'function') {
    alert('图片导出依赖 html2canvas（需要联网加载）。\n请确保已连接网络后刷新页面，或使用「导出项目」保存 JSON。');
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
    navigator.clipboard.writeText(text).then(function () { alert('已复制到剪贴板'); })
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
  try { document.execCommand('copy'); alert('已复制到剪贴板'); }
  catch (e) { alert('复制失败，请手动复制：\n\n' + text); }
  document.body.removeChild(ta);
}
