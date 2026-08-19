<<<<<<< HEAD
// 应用状态与持久化。state 是可变对象，被所有模块共享。
// 图片（Data URL）不再直接存于 localStorage，而是放在 IndexedDB，state 中只保留引用 ID。
// 运行时 state.characters[i].avatar 与 state.messages[i].image 仍为 Data URL（内存缓存），
// 但 save() 会剥离这些字段，只保留 avatarRef / imageRef。

import { dbPut, dbGet, dbDelete } from './db.js';
import { compressImage, formatBytes } from './imageUtils.js';

export const STORAGE_KEY = 'chatSimulator.v2'; // v2 = 图片引用模式

=======
// 应用状态与常量。state 是可变对象，被所有模块共享。
// 持久化到 localStorage 的键名。
export const STORAGE_KEY = 'chatSimulator.v1';

// 头像兜底颜色（未上传头像时按序/手动选择）。
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
export const AVATAR_COLORS = [
  '#f06292', '#7986cb', '#4db6ac', '#ffb74d', '#a1887f', '#64b5f6',
  '#ba68c8', '#81c784', '#e57373', '#4dd0e1', '#ff8a65', '#5c6bc0'
];

<<<<<<< HEAD
=======
// 聊天背景预设。
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
export const BGS = {
  'light': { label: '浅灰（默认）', css: '#edeef2' },
  'warm':  { label: '暖米色', css: '#f6efe4' },
  'dark':  { label: '深色', css: '#1c1c1e' },
  'green': { label: '淡绿', css: '#e6f2e6' },
  'blue':  { label: '淡蓝', css: '#e6eff7' },
  'grad1': { label: '渐变·紫粉', css: 'linear-gradient(160deg,#a18cd1,#fbc2eb)' },
  'grad2': { label: '渐变·青蓝', css: 'linear-gradient(160deg,#84fab0,#8fd3f4)' },
  'grad3': { label: '渐变·夜空', css: 'linear-gradient(160deg,#0f2027,#2c5364)' }
};

<<<<<<< HEAD
=======
// 全局应用状态。
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
export const state = {
  meta: { title: '我们的群聊', showTime: true, bg: 'light', autoHeight: true, bubbleCss: '', showInputBar: true },
  characters: [],
  messages: []
};

<<<<<<< HEAD
=======
// 把当前状态写入 localStorage（失败静默，例如隐私模式）。
export function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

// 按 id 查找人物。
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
export function getChar(id) {
  for (let i = 0; i < state.characters.length; i++) {
    if (state.characters[i].id === id) return state.characters[i];
  }
  return null;
}
<<<<<<< HEAD

// ---- 图片引用管理 ----

export async function storeImage(dataUrl, hint) {
  if (!dataUrl) return null;
  const compressed = await compressImage(dataUrl, 1200, 1200, 0.85);
  const ref = 'img_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6) + (hint ? '_' + hint : '');
  await dbPut(ref, compressed);
  return ref;
}

export async function resolveImage(ref) {
  if (!ref) return '';
  try { return await dbGet(ref) || ''; }
  catch (e) { return ''; }
}

export async function removeImage(ref) {
  if (!ref) return;
  try { await dbDelete(ref); } catch (e) { /* ignore */ }
}

// ---- 序列化辅助：剥离运行时 Data URL，保留引用 ----

function stripRuntimeImages(obj) {
  const copy = JSON.parse(JSON.stringify(obj));
  if (copy.characters) {
    copy.characters.forEach(c => {
      delete c.avatar; // 运行时 Data URL，不持久化
    });
  }
  if (copy.messages) {
    copy.messages.forEach(m => {
      delete m.image; // 运行时 Data URL，不持久化
      // imageW（图片宽度）数值很小，保留在 localStorage 中
    });
  }
  return copy;
}

// ---- 持久化 ----

const LS_WARN_THRESHOLD = 4 * 1024 * 1024; // 4MB 告警线
const LS_HARD_LIMIT = 5 * 1024 * 1024; // 5MB 硬上限

export function getStateJsonSize() {
  try {
    const stripped = stripRuntimeImages(state);
    return JSON.stringify(stripped).length;
  } catch (e) { return 0; }
}

export async function save() {
  try {
    const stripped = stripRuntimeImages(state);
    const json = JSON.stringify(stripped);
    const size = json.length;

    // 超限告警
    if (size > LS_HARD_LIMIT) {
      showStorageWarning('项目数据已超过 ' + formatBytes(LS_HARD_LIMIT) + '，localStorage 可能无法保存。建议减少图片数量或清空部分消息。');
      return;
    } else if (size > LS_WARN_THRESHOLD) {
      showStorageWarning('项目数据已接近 ' + formatBytes(LS_HARD_LIMIT) + '（当前 ' + formatBytes(size) + '），建议定期导出备份。');
    }

    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    if (e.name === 'QuotaExceededError' || (e.message && e.message.includes('quota'))) {
      showStorageWarning('存储空间不足！请删除部分图片或导出项目后清空数据。');
    }
    // 静默吞掉其他错误（如隐私模式）
  }
}

let _warnTimer = null;
function showStorageWarning(msg) {
  if (_warnTimer) clearTimeout(_warnTimer);
  let el = document.getElementById('storageWarning');
  if (!el) {
    el = document.createElement('div');
    el.id = 'storageWarning';
    el.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#ff5252;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.25);max-width:90%;word-break:break-all;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  _warnTimer = setTimeout(() => { if (el) el.style.display = 'none'; }, 6000);
}

// ---- 恢复：从 localStorage 加载并回填 IndexedDB 图片 ----

export async function load() {
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }

  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.messages) && Array.isArray(data.characters)) {
        // 兼容旧版 v1（直接存 Data URL）-> 迁移到 IndexedDB
        await migrateIfNeeded(data);

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
        // 从 IndexedDB 恢复运行时 Data URL
        await hydrateImages();
        return true;
      }
    } catch (e) { /* 数据损坏则回退到示例 */ }
  }

  // 检查旧版 v1 键名（直接存 Data URL 的版本）
  const v1Raw = localStorage.getItem('chatSimulator.v1');
  if (v1Raw) {
    try {
      const data = JSON.parse(v1Raw);
      if (data && Array.isArray(data.messages) && Array.isArray(data.characters)) {
        await migrateIfNeeded(data);
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
        await hydrateImages();
        // 迁移完成后删除旧键
        try { localStorage.removeItem('chatSimulator.v1'); } catch (e) {}
        return true;
      }
    } catch (e) {}
  }

  return false;
}

// 将旧版 Data URL 迁移到 IndexedDB
async function migrateIfNeeded(data) {
  let migrated = false;
  if (data.characters) {
    for (const c of data.characters) {
      if (c.avatar && !c.avatarRef && c.avatar.startsWith('data:')) {
        c.avatarRef = await storeImage(c.avatar, 'avatar_' + c.id);
        delete c.avatar; // 运行时会在 hydrate 中恢复
        migrated = true;
      }
    }
  }
  if (data.messages) {
    for (const m of data.messages) {
      if (m.image && !m.imageRef && m.image.startsWith('data:')) {
        m.imageRef = await storeImage(m.image, 'msg_' + m.id);
        delete m.image;
        migrated = true;
      }
    }
  }
  if (migrated) {
    // 迁移后立即保存新格式
    try {
      const stripped = stripRuntimeImages(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    } catch (e) {}
  }
}

// 从 IndexedDB 恢复所有被引用的图片到内存 state
async function hydrateImages() {
  const tasks = [];
  if (state.characters) {
    for (const c of state.characters) {
      if (c.avatarRef && !c.avatar) {
        tasks.push(
          dbGet(c.avatarRef).then(url => { if (url) c.avatar = url; })
        );
      }
    }
  }
  if (state.messages) {
    for (const m of state.messages) {
      if (m.imageRef && !m.image) {
        tasks.push(
          dbGet(m.imageRef).then(url => { if (url) m.image = url; })
        );
      }
    }
  }
  await Promise.all(tasks);
}

// ---- 导出时清理内部引用字段 ----
// 运行时 state 中 avatar/image 已是 Data URL（由 hydrateImages 回填），
// 导出时只需删除内部引用字段，外部无法读取 IndexedDB。

export function resolveStateForExport() {
  const copy = JSON.parse(JSON.stringify(state));
  if (copy.characters) {
    for (const c of copy.characters) {
      delete c.avatarRef;
    }
  }
  if (copy.messages) {
    for (const m of copy.messages) {
      delete m.imageRef;
    }
  }
  return copy;
}

// ---- 导入时把 Data URL 存入 IndexedDB ----

export async function prepareImportedState(data) {
  if (data.characters) {
    for (const c of data.characters) {
      if (c.avatar && !c.avatarRef && c.avatar.startsWith('data:')) {
        c.avatarRef = await storeImage(c.avatar, 'avatar_' + (c.id || 'import'));
        delete c.avatar;
      }
    }
  }
  if (data.messages) {
    for (const m of data.messages) {
      if (m.image && !m.imageRef && m.image.startsWith('data:')) {
        m.imageRef = await storeImage(m.image, 'msg_' + (m.id || 'import'));
        delete m.image;
      }
    }
  }
  return data;
}
=======
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
