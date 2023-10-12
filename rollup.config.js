import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: 'src/emitter.js',
    output: {
      name: 'emitter',
      file: pkg.browser,
      format: 'umd'
    },
    plugins: [
      commonjs(),
      terser()
    ]
  },
  {
    input: 'src/emitter.js',
    output: [
      { file: pkg.main, format: 'cjs', exports: "default" },
      { file: pkg.module, format: 'es', exports: "default" }
    ],
    plugins: [
      terser()
    ]
  },
]