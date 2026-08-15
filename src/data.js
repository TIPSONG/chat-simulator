// 示例数据（首次打开或点击「示例」时载入）。

import { state, save } from './state.js';
import { uid } from './utils.js';
import { applyMetaFromState, renderAll } from './render.js';

// 内联 SVG 占位图，用于演示「带图片的消息」。
function demoImage() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240">'
    + '<rect width="360" height="240" fill="#dbeafe"/>'
    + '<circle cx="300" cy="60" r="34" fill="#fbbf24"/>'
    + '<path d="M0 200 L90 130 L170 190 L240 150 L360 210 L360 240 L0 240 Z" fill="#7dd3a8"/>'
    + '<text x="30" y="60" font-family="sans-serif" font-size="22" fill="#334155">示例图片</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function loadDemo() {
  const c1 = { id: 'c1', name: '林晓', avatar: '', color: '#f06292' };
  const c2 = { id: 'c2', name: '阿哲', avatar: '', color: '#4db6ac' };
  const c3 = { id: 'c3', name: '苏苏', avatar: '', color: '#7986cb' };
  const me = { id: 'me', name: '我', avatar: '', color: '#5c6bc0', isMain: true };
  state.characters = [me, c1, c2, c3];
  state.messages = [
    { id: uid(), type: 'event', text: '林晓 邀请 阿哲、苏苏 加入了群聊', time: '09:00' },
    { id: uid(), type: 'message', characterId: 'c1', text: '大家早上好呀！今天天气真不错 ☀️', time: '09:02' },
    { id: uid(), type: 'message', characterId: 'me', text: '早呀，今天去哪儿玩？', time: '09:02' },
    { id: uid(), type: 'message', characterId: 'c2', text: '早～我拍了张照片给你们看看', time: '09:03' },
    { id: uid(), type: 'message', characterId: 'c2', text: '', image: demoImage(), time: '09:03' },
    { id: uid(), type: 'narration', text: '（这时，苏苏从门口走进来，手里拿着两杯奶茶。）', time: '09:05' },
    { id: uid(), type: 'message', characterId: 'c3', text: '我给大家带了奶茶！', time: '09:06' },
    { id: uid(), type: 'message', characterId: 'me', text: '哇，谢谢苏苏！', time: '09:06' },
    { id: uid(), type: 'special', text: '两人相视一笑，气氛忽然变得温柔起来', time: '09:08' },
    { id: uid(), type: 'event', text: '你已将群名称修改为「我们的群聊」', time: '09:10' }
  ];
  applyMetaFromState();
  renderAll();
  save();
}
