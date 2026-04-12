import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/sandbox/',
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'dist/sandbox'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/ui/sandbox/sandbox-runtime.js'),
      name: 'SandboxRuntime',
      fileName: 'sandbox-runtime',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
});
