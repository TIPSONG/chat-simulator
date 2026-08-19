// 纯工具函数（不依赖其它业务模块）。

// 生成短随机 id。
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function pad(n) { return n < 10 ? '0' + n : '' + n; }

export function nowTime() {
  const d = new Date();
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// 便捷的 getElementById。
export function $(id) { return document.getElementById(id); }

// 昵称首字（用于无头像时的占位字符）。
export function initial(name) { return name ? name.trim().charAt(0) : '?'; }

// 读取本地图片文件为 dataURL，通过回调返回。
export function readImageFile(file, cb) {
  if (!file) return;
  const r = new FileReader();
  r.onload = function () { cb(r.result); };
  r.readAsDataURL(file);
}

// 触发浏览器下载一个文本/二进制内容。
export function download(filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 500);
}

// 构建头像 DOM：有图片显示图片，否则显示带底色的首字。
export function buildAvatarEl(char, circle) {
  const el = document.createElement('div');
  el.className = 'avatar' + (circle ? ' circle' : '');
  const name = char ? char.name : '未知';
  if (char && char.avatar) {
    const img = document.createElement('img');
    img.src = char.avatar;
    img.alt = name;
    el.appendChild(img);
  } else {
    el.style.background = char && char.color ? char.color : '#c7ccd8';
    el.textContent = initial(name);
  }
  return el;
}
