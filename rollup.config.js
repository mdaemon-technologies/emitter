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
      { file: "dist/emitter.cjs.js", format: 'cjs', exports: 'default' },
      { file: "dist/emitter.mjs.js", format: 'es' }
    ],
    plugins: [
      terser()
    ]
  }
]