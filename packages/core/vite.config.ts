import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['**/*.spec.ts', '**/*.test.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ExcelRendererCore',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['xlsx'],
      output: {
        globals: {
          xlsx: 'XLSX',
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
})