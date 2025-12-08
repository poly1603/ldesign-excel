import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@excel-viewer/core': resolve(__dirname, '../packages/core/src'),
      '@excel-viewer/vue': resolve(__dirname, '../packages/vue/src')
    }
  },
  server: {
    port: 5555,
    host: true,
    open: true
  }
});
