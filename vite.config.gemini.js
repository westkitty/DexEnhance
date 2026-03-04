import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist/content/gemini',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/content/gemini/index.js'),
      formats: ['iife'],
      name: 'DexEnhanceGemini',
      fileName: () => 'index.js',
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
