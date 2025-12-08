import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import vue from 'rollup-plugin-vue';
import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    vue({
      preprocessStyles: true
    }),
    resolve({
      browser: true,
      extensions: ['.js', '.ts', '.vue']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist'
    }),
    postcss({
      extract: 'styles/index.css',
      minimize: production
    }),
    production && terser()
  ],
  external: ['vue', '@excel-viewer/core']
};
