// IndexedDB 图片存储层：将大体积 Data URL 从 localStorage 移出，state 中只存引用 ID。
// 键值设计：imageId -> { dataUrl, size, createdAt }

const DB_NAME = 'ChatSimulatorImages';
const DB_VERSION = 1;
const STORE_NAME = 'images';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function dbPut(key, dataUrl) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const size = dataUrl ? dataUrl.length : 0;
    const req = store.put({ dataUrl, size, createdAt: Date.now() }, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function dbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function dbKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

// 计算所有已存储图片的总大小（字符数，近似字节数）
export async function dbTotalSize() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const total = req.result.reduce((sum, item) => sum + (item.size || 0), 0);
      resolve(total);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

// 垃圾回收：删除 state 中不再引用的图片
export async function gcImages(state) {
  const used = new Set();
  // 收集所有被引用的 imageId
  state.characters.forEach(c => { if (c.avatarRef) used.add(c.avatarRef); });
  state.messages.forEach(m => {
    if (m.imageRef) used.add(m.imageRef);
  });
  const allKeys = await dbKeys();
  const toDelete = allKeys.filter(k => !used.has(k));
  for (const key of toDelete) {
    await dbDelete(key);
  }
  return toDelete.length;
}
