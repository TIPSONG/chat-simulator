import { defineConfig } from 'vite';

export default defineConfig({
  // 相对路径，便于部署到任意子路径（如 GitHub Pages / 静态服务器）
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
});
