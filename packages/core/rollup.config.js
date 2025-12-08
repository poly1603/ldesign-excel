import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
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
    resolve({
      browser: true
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
  external: ['jszip', 'fflate']
};
