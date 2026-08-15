// 应用状态与常量。state 是可变对象，被所有模块共享。
// 持久化到 localStorage 的键名。
export const STORAGE_KEY = 'chatSimulator.v1';

// 头像兜底颜色（未上传头像时按序/手动选择）。
export const AVATAR_COLORS = [
  '#f06292', '#7986cb', '#4db6ac', '#ffb74d', '#a1887f', '#64b5f6',
  '#ba68c8', '#81c784', '#e57373', '#4dd0e1', '#ff8a65', '#5c6bc0'
];

// 聊天背景预设。
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

// 全局应用状态。
export const state = {
  meta: { title: '我们的群聊', showTime: true, bg: 'light', autoHeight: true, bubbleCss: '', showInputBar: true },
  characters: [],
  messages: []
};

// 把当前状态写入 localStorage（失败静默，例如隐私模式）。
export function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

// 按 id 查找人物。
export function getChar(id) {
  for (let i = 0; i < state.characters.length; i++) {
    if (state.characters[i].id === id) return state.characters[i];
  }
  return null;
}
