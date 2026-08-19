// 气泡样式自定义：在侧栏「气泡样式」二级菜单里编辑 CSS，应用到聊天气泡。

import { $ } from './utils.js';
import { state, save } from './state.js';

// 默认气泡 CSS（带注释，展示在编辑框里）。
export const DEFAULT_BUBBLE_CSS = `/* ============================================
   聊天气泡样式（可自由修改后点击「应用样式」）
   - .bubble                左侧（对方）气泡
   - .msg-row.right .bubble 右侧（自己/主人物）气泡
   - .msg-name              对方昵称
   - .msg-text              气泡内文字
============================================ */

/* 左侧（对方）气泡 */
.bubble {
  background: #ffffff;                /* 背景色 */
  border-radius: 4px 12px 12px 12px;  /* 圆角：左上 右上 右下 左下 */
  padding: 9px 12px;                  /* 内边距 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, .06); /* 阴影 */
  color: #1f2329;                     /* 文字颜色 */
  line-height: 1.55;                  /* 行高 */
}

/* 右侧（自己）气泡 */
.msg-row.right .bubble {
  background: #95ec69;                /* 背景色（微信绿） */
  border-radius: 12px 4px 12px 12px;
  padding: 9px 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .06);
  color: #1f2329;
}

/* 对方昵称 */
.msg-name {
  font-size: 12px;
  color: #7d8291;
  margin-bottom: 2px;
  padding-left: 2px;
}

/* 气泡内文字 */
.msg-text {
  font-size: 15px;
}
`;

// 注入 / 移除自定义气泡样式（放在 head 末尾，覆盖默认样式）。
export function applyBubbleCss() {
  let el = document.getElementById('bubbleCustomStyle');
  const css = (state.meta.bubbleCss || '').trim();
  if (css) {
    if (!el) {
      el = document.createElement('style');
      el.id = 'bubbleCustomStyle';
      document.head.appendChild(el);
    }
    el.textContent = css;
  } else if (el) {
    el.remove();
  }
}

// 应用编辑框里的 CSS。
export function commitBubbleCss() {
  state.meta.bubbleCss = $('bubbleCssInput').value;
  applyBubbleCss();
  save();
}

// 恢复默认气泡样式。
export function resetBubbleCss() {
  state.meta.bubbleCss = '';
  $('bubbleCssInput').value = DEFAULT_BUBBLE_CSS;
  applyBubbleCss();
  save();
}
