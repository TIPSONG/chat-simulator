// 演示播放模式（Play Mode）—— 按时间轴逐条播放消息。
// 提供播放/暂停、速度控制、进度拖拽、循环播放。

import { state } from './state.js';
import { $, nowTime } from './utils.js';
import { buildMessageEl } from './render.js';

let isPlaying = false;
let playIndex = 0;       // 当前播放到第几条
let playTimer = null;
let playSpeed = 1;       // 倍速
let playLoop = false;    // 循环播放

const BASE_DELAY = 1200; // 每条消息间隔基准（毫秒）

// 是否处于播放模式
export function inPlayMode() {
  return document.body.classList.contains('play-mode');
}

// 进入播放模式
export function enterPlayMode() {
  if (state.messages.length === 0) { alert('当前没有消息，无法播放演示'); return; }
  document.body.classList.add('play-mode');
  resetPlay();
  renderPlayControls();
  playNext();
}

// 退出播放模式
export function exitPlayMode() {
  stopPlay();
  document.body.classList.remove('play-mode');
  removePlayControls();
  // 恢复完整渲染
  const area = $('chatArea');
  area.innerHTML = '';
  state.messages.forEach(function (m, idx) {
    area.appendChild(buildMessageEl(m, idx));
  });
  area.scrollTop = area.scrollHeight;
}

// 播放下一条
function playNext() {
  if (!isPlaying) return;
  if (playIndex >= state.messages.length) {
    if (playLoop) { playIndex = 0; }
    else { pausePlay(); updatePlayStatus('已结束'); return; }
  }

  const m = state.messages[playIndex];
  const area = $('chatArea');

  // 如果是第一条，先清空
  if (playIndex === 0) area.innerHTML = '';

  // 先显示 typing 指示器（如果是 message 类型）
  const showTyping = m.type === 'message' && playIndex > 0;
  let typingEl = null;
  if (showTyping) {
    typingEl = createTypingIndicator(m.characterId);
    area.appendChild(typingEl);
    area.scrollTop = area.scrollHeight;
  }

  // 延迟后显示真实消息
  const delay = typingEl ? 600 / playSpeed : 0;
  playTimer = setTimeout(() => {
    if (typingEl) typingEl.remove();
    const el = buildMessageEl(m, playIndex);
    // 添加入场动画
    addEntranceAnimation(el, m, playIndex);
    area.appendChild(el);
    area.scrollTop = area.scrollHeight;
    playIndex++;
    updatePlayProgress();
    // 间隔后播放下一条
    const nextDelay = calculateDelay(m) / playSpeed;
    playTimer = setTimeout(playNext, nextDelay);
  }, delay);
}

// 计算本条消息到下一条的间隔（基于时间差或默认）
function calculateDelay(m) {
  const next = state.messages[playIndex + 1];
  if (!next) return BASE_DELAY;
  // 如果两条消息有时间，按时间差估算
  if (m.time && next.time) {
    const t1 = parseTime(m.time);
    const t2 = parseTime(next.time);
    if (t1 !== null && t2 !== null) {
      const diff = Math.max(0, t2 - t1); // 分钟差
      if (diff <= 1) return 800;
      if (diff <= 5) return 1200;
      if (diff <= 30) return 1800;
      return 2500;
    }
  }
  return BASE_DELAY;
}

function parseTime(str) {
  if (!str) return null;
  const m = str.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

// 创建打字指示器
function createTypingIndicator(characterId) {
  const ch = state.characters.find(c => c.id === characterId);
  const row = document.createElement('div');
  row.className = 'msg-row typing-indicator-row';
  row.style.opacity = '0.7';

  const avatar = document.createElement('div');
  avatar.className = 'avatar circle';
  avatar.style.cssText = 'width:32px;height:32px;font-size:12px;';
  if (ch && ch.avatar) {
    const img = document.createElement('img');
    img.src = ch.avatar;
    avatar.appendChild(img);
  } else {
    avatar.style.background = ch && ch.color ? ch.color : '#c7ccd8';
    avatar.textContent = ch ? ch.name.charAt(0) : '?';
  }

  const body = document.createElement('div');
  body.className = 'msg-body';

  const bubble = document.createElement('div');
  bubble.className = 'bubble typing-bubble';
  bubble.style.cssText = 'padding:10px 14px;min-width:56px;';

  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';
  bubble.appendChild(dots);
  body.appendChild(bubble);
  row.appendChild(avatar);
  row.appendChild(body);
  return row;
}

// 添加入场动画
function addEntranceAnimation(el, m, idx) {
  const ch = state.characters.find(c => c.id === m.characterId);
  const isMain = !!(ch && ch.isMain);

  // 基础淡入
  el.classList.add('anim-fade-in');

  // 滑入方向
  if (m.type === 'message') {
    el.classList.add(isMain ? 'anim-slide-right' : 'anim-slide-left');
  }

  // 错峰延迟（按索引递增，最大 300ms）
  const stagger = Math.min(idx * 60, 300);
  el.style.animationDelay = stagger + 'ms';
}

// 播放控制
export function togglePlayPause() {
  if (isPlaying) pausePlay();
  else resumePlay();
}

function pausePlay() {
  isPlaying = false;
  if (playTimer) { clearTimeout(playTimer); playTimer = null; }
  updatePlayStatus('已暂停');
}

function resumePlay() {
  if (playIndex >= state.messages.length && !playLoop) {
    resetPlay();
  }
  isPlaying = true;
  updatePlayStatus('播放中');
  playNext();
}

function stopPlay() {
  isPlaying = false;
  if (playTimer) { clearTimeout(playTimer); playTimer = null; }
  playIndex = 0;
}

function resetPlay() {
  stopPlay();
  playIndex = 0;
  const area = $('chatArea');
  area.innerHTML = '<div class="empty">点击播放开始演示…</div>';
  updatePlayProgress();
}

// 跳转到指定进度（0~1）
export function seekPlay(ratio) {
  const target = Math.max(0, Math.min(state.messages.length - 1, Math.floor(ratio * state.messages.length)));
  playIndex = target;
  // 清空并重新渲染到目标位置
  const area = $('chatArea');
  area.innerHTML = '';
  for (let i = 0; i <= target && i < state.messages.length; i++) {
    const el = buildMessageEl(state.messages[i], i);
    addEntranceAnimation(el, state.messages[i], i);
    area.appendChild(el);
  }
  area.scrollTop = area.scrollHeight;
  updatePlayProgress();
}

// 倍速
export function setPlaySpeed(s) {
  playSpeed = Math.max(0.25, Math.min(4, parseFloat(s) || 1));
}

export function getPlaySpeed() { return playSpeed; }

// 循环
export function toggleLoop() {
  playLoop = !playLoop;
  return playLoop;
}

export function getLoop() { return playLoop; }

// ---- UI 更新 ----

function renderPlayControls() {
  let bar = $('playBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'playBar';
    bar.className = 'play-bar';
    bar.innerHTML = `
      <button class="play-btn" id="playToggleBtn" title="播放/暂停">▶</button>
      <div class="play-info">
        <span id="playStatus">准备就绪</span>
        <input type="range" id="playProgress" min="0" max="100" value="0" title="拖动跳转">
      </div>
      <select id="playSpeedSel" title="播放速度">
        <option value="0.5">0.5x</option>
        <option value="1" selected>1x</option>
        <option value="1.5">1.5x</option>
        <option value="2">2x</option>
      </select>
      <button class="play-btn" id="playLoopBtn" title="循环">🔁</button>
      <button class="play-btn danger" id="playExitBtn" title="退出演示">✕</button>
    `;
    document.querySelector('.app').appendChild(bar);

    // 绑定事件
    $('playToggleBtn').addEventListener('click', togglePlayPause);
    $('playProgress').addEventListener('input', function () {
      pausePlay();
      seekPlay(this.value / 100);
    });
    $('playSpeedSel').addEventListener('change', function () {
      setPlaySpeed(this.value);
    });
    $('playLoopBtn').addEventListener('click', function () {
      const on = toggleLoop();
      this.style.opacity = on ? '1' : '0.4';
    });
    $('playExitBtn').addEventListener('click', exitPlayMode);
  }
  bar.style.display = 'flex';
}

function removePlayControls() {
  const bar = $('playBar');
  if (bar) bar.style.display = 'none';
}

function updatePlayStatus(text) {
  const el = $('playStatus');
  if (el) el.textContent = text;
  const btn = $('playToggleBtn');
  if (btn) btn.textContent = isPlaying ? '⏸' : '▶';
}

function updatePlayProgress() {
  const el = $('playProgress');
  if (el && state.messages.length > 0) {
    el.value = Math.round((playIndex / state.messages.length) * 100);
  }
}
