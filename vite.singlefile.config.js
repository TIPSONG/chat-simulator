import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 单文件分享包配置：构建时把 JS / CSS / html2canvas 全部内联进一个 index.html，
// 产物位于 dist-single/，双击即可在浏览器打开，无需服务器、无需联网、不暴露源码。
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist-single',
    assetsDir: 'assets',
    cssCodeSplit: false,
    // 默认已经是内联；这里放宽内联上限与体积告警，避免大图 base64 触发告警
    assetsInlineLimit: 100 * 1024 * 1024,
    chunkSizeWarningLimit: 100 * 1024 * 1024
  }
});
