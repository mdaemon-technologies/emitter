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
      commonjs()
    ]
  },
  {
    input: 'src/emitter.js',
    output: [
      { file: "dist/emitter.cjs", format: 'cjs', exports: "default" },
      { file: "dist/emitter.mjs", format: 'es' }
    ],
    plugins: [
      
    ]
  },
]