import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist/background',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/background/service_worker.js'),
      formats: ['iife'],
      name: 'DexEnhanceBackground',
      fileName: () => 'service_worker.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
});
