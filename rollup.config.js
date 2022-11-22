import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default [
  // browser-friendly UMD build
  {
    input: 'src/emitter.js',
    output: {
      name: 'emitter',
      file: "dist/emitter.umd.js",
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
      { file: "dist/emitter.cjs", format: 'cjs', exports: 'default' },
      { file: "dist/emitter.mjs", format: 'es' }
    ],
    plugins: [
      terser()
    ]
  },
  {
    input: 'src/is.js',
    output: {
      name: 'is',
      file: "dist/is.umd.js",
      format: 'umd'
    },
    plugins: [
      commonjs(),
      terser()
    ]
  },
  {
    input: 'src/is.js',
    output: [
      { file: "dist/is.cjs", format: 'cjs', exports: 'default' },
      { file: "dist/is.mjs", format: 'es' }
    ],
    plugins: [
      terser()
    ]
  },
]