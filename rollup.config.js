import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import pkg from './package.json';

export default [
  {
    input: 'src/emitter.js',
    output: [
      { file: pkg.main, format: 'umd', exports: "default", name: "Emitter" },
      { file: pkg.common, format: 'cjs', exports: "default", name: "Emitter" },
      { file: pkg.module, format: 'es', exports: "default", name: "Emitter" }
    ],
    plugins: [
      commonjs(),
      terser()
    ]
  },
]