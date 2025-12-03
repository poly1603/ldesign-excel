import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['**/*.spec.ts', '**/*.test.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ExcelRendererVue',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue', '@excel-renderer/core', '@vueuse/core'],
      output: {
        globals: {
          vue: 'Vue',
          '@excel-renderer/core': 'ExcelRendererCore',
          '@vueuse/core': 'VueUse',
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
})