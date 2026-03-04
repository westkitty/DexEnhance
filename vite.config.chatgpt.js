import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist/content/chatgpt',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/content/chatgpt/index.js'),
      formats: ['iife'],
      name: 'DexEnhanceChatGPT',
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
