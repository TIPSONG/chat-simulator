// 消息管理：添加内容（composer）、消息增删/排序、编辑弹窗。
// 依赖 render.js 与 crop.js；与 render 形成循环依赖（见 render.js 顶部说明）。

<<<<<<< HEAD
import { state, getChar, save, storeImage, removeImage } from './state.js';
=======
import { state, getChar, save } from './state.js';
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
import { $, nowTime, uid } from './utils.js';
import { renderChat, renderAll, renderPhoneHead, updateEditHint } from './render.js';
import { askImageChoice } from './crop.js';

let composerType = 'message';
let tempMsgImage = '';
<<<<<<< HEAD
let tempMsgImageRef = '';
=======
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a

// ---- Composer ----

export function setComposerType(type) {
  composerType = type;
  const btns = $('typeSwitch').querySelectorAll('.tp');
  btns.forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-type') === type);
  });
  const isMsg = type === 'message';
  $('msgCharField').classList.toggle('hidden', !isMsg);
  $('msgImageField').classList.toggle('hidden', !isMsg);
  const labels = { message: '对话内容', narration: '旁白内容', special: '特殊事件内容', event: '事件内容' };
  const ph = {
    message: '输入对话内容…',
    narration: '输入旁白，例如：（窗外下起了雨…）',
    special: '输入特殊事件，例如：两人目光交汇…',
    event: '输入居中事件，例如：XX 加入了群聊'
  };
  $('msgTextLabel').textContent = labels[type] || '内容';
  $('msgText').placeholder = ph[type] || '输入内容…';
}

export function resetMsgForm() {
  $('msgText').value = '';
  tempMsgImage = '';
<<<<<<< HEAD
  tempMsgImageRef = '';
=======
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
  $('msgImageRemoveBtn').style.display = 'none';
  $('msgImagePreview').classList.add('hidden');
  $('msgImagePreview').innerHTML = '';
}

export function renderMsgImagePreview() {
  const box = $('msgImagePreview');
  box.innerHTML = '';
  if (tempMsgImage) {
    box.classList.remove('hidden');
    const img = document.createElement('img');
    img.src = tempMsgImage;
    box.appendChild(img);
  } else {
    box.classList.add('hidden');
  }
}

<<<<<<< HEAD
export async function addMessage() {
=======
export function addMessage() {
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
  const text = $('msgText').value.trim();
  if (composerType === 'message') {
    const chId = $('msgCharSelect').value;
    if (!chId || !getChar(chId)) { alert('请先选择说话人物'); return; }
    if (!text && !tempMsgImage) { alert('请输入对话内容或添加图片'); return; }
    state.messages.push({
      id: uid(), type: 'message', characterId: chId,
<<<<<<< HEAD
      text: text, image: tempMsgImage, imageRef: tempMsgImageRef,
=======
      text: text, image: tempMsgImage || '',
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
      time: nowTime()
    });
  } else {
    if (!text) { alert('请输入内容'); return; }
    state.messages.push({ id: uid(), type: composerType, text: text, time: nowTime() });
  }
  resetMsgForm();
  renderChat();
  renderPhoneHead();
<<<<<<< HEAD
  await save();
}

export async function deleteMessage(id) {
  const m = state.messages.find(msg => msg.id === id);
  if (m && m.imageRef) await removeImage(m.imageRef);
  state.messages = state.messages.filter(function (msg) { return msg.id !== id; });
  renderChat();
  await save();
=======
  save();
}

export function deleteMessage(id) {
  state.messages = state.messages.filter(function (m) { return m.id !== id; });
  renderChat();
  save();
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
}

export function moveMessage(idx, dir) {
  const j = idx + dir;
  if (j < 0 || j >= state.messages.length) return;
  const tmp = state.messages[idx];
  state.messages[idx] = state.messages[j];
  state.messages[j] = tmp;
  renderChat();
  save();
}

// ---- Edit modal ----

let editingMsgId = null;
let editType = 'message';
let editTempImage = '';
<<<<<<< HEAD
let editTempImageRef = '';
let editOriginalImageRef = '';
=======
let editOriginalImage = '';
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a

export function openEdit(id) {
  let m = null;
  for (let i = 0; i < state.messages.length; i++) {
    if (state.messages[i].id === id) { m = state.messages[i]; break; }
  }
  if (!m) return;
  editingMsgId = id;
  editType = m.type;
  editTempImage = m.image || '';
<<<<<<< HEAD
  editTempImageRef = m.imageRef || '';
  editOriginalImageRef = m.imageRef || '';
=======
  editOriginalImage = m.image || '';
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
  $('editText').value = m.text || '';
  $('editTimeInput').value = m.time || '';
  setEditType(editType);
  if (editType === 'message') {
    $('editCharSelect').value = m.characterId || '';
    updateEditHint();
    renderEditImagePreview();
  }
  $('editOverlay').classList.remove('hidden');
  $('editText').focus();
}

export function setEditType(type) {
  editType = type;
  const btns = $('editTypeSwitch').querySelectorAll('.tp');
  btns.forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-type') === type);
  });
  const isMsg = type === 'message';
  $('editCharField').classList.toggle('hidden', !isMsg);
  $('editImageField').classList.toggle('hidden', !isMsg);
  $('editTimeField').classList.toggle('hidden', !isMsg || !state.meta.showTime);
  const labels = { message: '对话内容', narration: '旁白内容', special: '特殊事件内容', event: '事件内容' };
  $('editTextLabel').textContent = labels[type] || '内容';
}

export function renderEditImagePreview() {
  const box = $('editImagePreview');
  box.innerHTML = '';
  if (editTempImage) {
    box.classList.remove('hidden');
    const img = document.createElement('img');
    img.src = editTempImage;
    box.appendChild(img);
    $('editImageRemoveBtn').style.display = '';
  } else {
    box.classList.add('hidden');
    $('editImageRemoveBtn').style.display = 'none';
  }
}

<<<<<<< HEAD
export async function saveEdit() {
=======
export function saveEdit() {
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
  let m = null;
  for (let i = 0; i < state.messages.length; i++) {
    if (state.messages[i].id === editingMsgId) { m = state.messages[i]; break; }
  }
  if (!m) return;
  const text = $('editText').value.trim();
  if (editType === 'message') {
    const chId = $('editCharSelect').value;
    if (!text && !editTempImage) { alert('请输入对话内容或保留图片'); return; }
<<<<<<< HEAD
    // 如果图片换了，删除旧引用
    if (editOriginalImageRef && editOriginalImageRef !== editTempImageRef) {
      await removeImage(editOriginalImageRef);
    }
=======
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
    m.type = 'message';
    m.characterId = chId;
    m.text = text;
    m.image = editTempImage;
<<<<<<< HEAD
    m.imageRef = editTempImageRef;
    m.time = $('editTimeInput').value.trim();
    if (editTempImageRef !== editOriginalImageRef) delete m.imageW;
  } else {
    if (!text) { alert('请输入内容'); return; }
    // 切到非消息类型时，清理图片
    if (m.imageRef) {
      await removeImage(m.imageRef);
      delete m.imageRef;
      delete m.image;
    }
    m.type = editType;
    m.text = text;
=======
    m.time = $('editTimeInput').value.trim();
    if (editTempImage !== editOriginalImage) delete m.imageW;
  } else {
    if (!text) { alert('请输入内容'); return; }
    m.type = editType;
    m.text = text;
    delete m.image;
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
    delete m.characterId;
  }
  closeEdit();
  renderAll();
<<<<<<< HEAD
  await save();
=======
  save();
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
}

export function closeEdit() {
  editingMsgId = null;
  $('editOverlay').classList.add('hidden');
}

// ---- 供 events.js 回填/清除消息图片的封装 ----

<<<<<<< HEAD
export async function setMsgImage(dataUrl) {
  const ref = await storeImage(dataUrl, 'msg');
  tempMsgImageRef = ref;
=======
export function setMsgImage(dataUrl) {
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
  tempMsgImage = dataUrl;
  renderMsgImagePreview();
  $('msgImageRemoveBtn').style.display = '';
}

export function clearMsgImage() {
  tempMsgImage = '';
<<<<<<< HEAD
  tempMsgImageRef = '';
=======
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
  renderMsgImagePreview();
  $('msgImageRemoveBtn').style.display = 'none';
}

<<<<<<< HEAD
export async function setEditImage(dataUrl) {
  const ref = await storeImage(dataUrl, 'msg');
  editTempImageRef = ref;
=======
export function setEditImage(dataUrl) {
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
  editTempImage = dataUrl;
  renderEditImagePreview();
}

export function clearEditImage() {
  editTempImage = '';
<<<<<<< HEAD
  editTempImageRef = '';
=======
>>>>>>> 579922c52149b11724dcde3ac43fd3db5ed16b6a
  renderEditImagePreview();
}
