import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      formats: ['es', 'cjs'],
      entry: [resolve(__dirname, 'src/index.ts')],
    },
    rollupOptions: {
      output: {
        preserveModules: true,
      },
      external: ['@codemirror/state', '@codemirror/view'],
    },
  },
  plugins: [dts()],
});
