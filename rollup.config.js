import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default [
  // browser-friendly UMD build
  {
    input: 'src/event_emitter.js',
    output: {
      name: 'event_emitter',
      file: "dist/event_emitter.umd.js",
      format: 'umd'
    },
    plugins: [
      commonjs(),
      terser()
    ]
  },
  {
    input: 'src/event_emitter.js',
    output: [
      { file: "dist/event_emitter.cjs.js", format: 'cjs' },
      { file: "dist/event_emitter.mjs.js", format: 'es' }
    ],
    plugins: [
      terser()
    ]
  }
]