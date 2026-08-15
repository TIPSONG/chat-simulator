// 人物管理：表单编辑、增删改，以及头像的裁剪结果回填。
// 依赖 render.js（renderAll），与 render 形成循环依赖（见 render.js 顶部说明）。

import { state, getChar, save } from './state.js';
import { $, initial, uid } from './utils.js';
import { renderAll } from './render.js';

let editingCharId = null;
let tempCharAvatar = '';

// 预览头像：有图片显示图片，否则显示首字 + 底色。
function renderCharAvatarPreview() {
  const prev = $('charAvatarPreview');
  prev.innerHTML = '';
  if (tempCharAvatar) {
    const img = document.createElement('img');
    img.src = tempCharAvatar;
    img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover';
    prev.appendChild(img);
  } else {
    prev.textContent = initial($('charName').value || '?');
    prev.style.background = $('charColor').value || '#c7ccd8';
  }
}

// 进入「编辑人物」状态。
export function startEditCharacter(id) {
  const ch = getChar(id);
  if (!ch) return;
  editingCharId = id;
  tempCharAvatar = ch.avatar || '';
  $('charName').value = ch.name;
  $('charColor').value = ch.color || '#4c7cff';
  $('charAvatarPreview').textContent = initial(ch.name);
  $('charAvatarPreview').style.background = ch.color || '#4c7cff';
  renderCharAvatarPreview();
  $('addCharBtn').textContent = '保存修改';
  $('cancelCharEditBtn').style.display = '';
  $('charName').focus();
}

// 重置人物表单为「新增」状态。
export function resetCharForm() {
  editingCharId = null;
  tempCharAvatar = '';
  $('charName').value = '';
  $('charColor').value = '#4c7cff';
  $('charAvatarPreview').textContent = '?';
  $('charAvatarPreview').style.background = '#c7ccd8';
  renderCharAvatarPreview();
  $('addCharBtn').textContent = '＋ 添加人物';
  $('cancelCharEditBtn').style.display = 'none';
}

// 新增或保存人物。
export function addOrUpdateCharacter() {
  const name = $('charName').value.trim();
  if (!name) { alert('请填写人物昵称'); return; }
  const color = $('charColor').value;
  if (editingCharId) {
    const ch = getChar(editingCharId);
    if (ch) {
      ch.name = name;
      ch.color = color;
      ch.avatar = tempCharAvatar;
    }
  } else {
    state.characters.push({ id: uid(), name: name, avatar: tempCharAvatar, color: color });
  }
  resetCharForm();
  renderAll();
  save();
}

export function deleteCharacter(id) {
  const ch = getChar(id);
  if (!ch) return;
  if (!confirm('确定删除人物「' + (ch.name || '未命名') + '」吗？\n其已发送的消息将保留，但会显示为「未知角色」。')) return;
  state.characters = state.characters.filter(function (c) { return c.id !== id; });
  if (editingCharId === id) resetCharForm();
  renderAll();
  save();
}

// 以下三个封装用于 events.js 回填/读取头像，避免跨模块直接改模块内变量。
export function setCharAvatar(dataUrl) {
  tempCharAvatar = dataUrl;
  renderCharAvatarPreview();
}

export function clearCharAvatar() {
  tempCharAvatar = '';
  renderCharAvatarPreview();
}

export function hasCharAvatar() {
  return !!tempCharAvatar;
}
