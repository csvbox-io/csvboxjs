import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CSVBoxImporter',
      formats: ['es', 'cjs'],
      fileName: (format) => `csvbox.${format}.js`
    },
    rollupOptions: {
      external: [],
    },
  },
  plugins: [dts()]
});
