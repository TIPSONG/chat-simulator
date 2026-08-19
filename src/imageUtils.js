// 图片压缩工具：把过大的 Data URL 压缩到可控大小再存入 IndexedDB。

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MAX_HEIGHT = 1200;
const DEFAULT_QUALITY = 0.85;

/**
 * 将 Data URL 压缩到指定尺寸/质量。
 * @param {string} dataUrl - 原始图片 Data URL
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @param {number} quality - JPEG 质量 0~1
 * @returns {Promise<string>} 压缩后的 Data URL（JPEG 或 PNG）
 */
export function compressImage(dataUrl, maxWidth = DEFAULT_MAX_WIDTH, maxHeight = DEFAULT_MAX_HEIGHT, quality = DEFAULT_QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      // 如果原图是 PNG 且带透明，尝试保持 PNG；否则用 JPEG
      const isPng = dataUrl.startsWith('data:image/png');
      let result;
      try {
        result = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
      } catch (e) {
        result = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(result);
    };
    img.onerror = () => reject(new Error('图片加载失败，无法压缩'));
    img.src = dataUrl;
  });
}

/**
 * 估算 Data URL 的字节数（Base64 解码后的近似大小）。
 */
export function estimateDataUrlSize(dataUrl) {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(',')[1];
  if (!base64) return dataUrl.length;
  // Base64 每 4 字符 = 3 字节，尾部可能有一两个 = 填充
  return Math.floor(base64.length * 3 / 4);
}

/**
 * 格式化字节数为人类可读字符串。
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检查 localStorage 剩余可用空间（近似，通过尝试写入测试）。
 * 返回剩余可用字节数的估计值，或 null（如果无法估算）。
 */
export function estimateLocalStorageRemaining() {
  const testKey = '__ls_test__';
  const chunk = 'a'.repeat(1024 * 50); // 50KB chunk
  let used = 0;
  try {
    // 先清掉测试键
    localStorage.removeItem(testKey);
    while (true) {
      localStorage.setItem(testKey, chunk.repeat(used + 1));
      used++;
    }
  } catch (e) {
    localStorage.removeItem(testKey);
    return used * 1024 * 50;
  }
  return null;
}
