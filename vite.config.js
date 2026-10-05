import { defineConfig } from 'vite';

// fontsource 的 CSS 同时引用 woff2 和 woff；现代浏览器只需要 woff2，去掉 woff 能让 CSS 和打包体积小一半
const stripWoff = {
  name: 'strip-woff-fallback',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('@fontsource') && id.endsWith('.css')) {
      return code.replace(/,\s*url\([^)]*\.woff\)\s*format\(['"]woff['"]\)/g, '');
    }
  },
};

export default defineConfig({
  // 相对路径：部署在 https://<用户名>.github.io/<仓库名>/ 这样的子目录也能正常加载
  base: './',
  plugins: [stripWoff],
  build: { chunkSizeWarningLimit: 900 },
});
