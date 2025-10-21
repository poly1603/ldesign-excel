import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ldesign/excel-viewer-vue': resolve(__dirname, '../../packages/vue/src/index.ts'),
      '@ldesign/excel-viewer-core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  server: {
    port: 5001,
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});


