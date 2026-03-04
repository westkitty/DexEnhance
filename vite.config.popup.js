import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Ensure generated popup asset URLs resolve under the popup route in extension pages.
  // e.g. /popup/index.js instead of /index.js.
  base: '/popup/',
  // publicDir defaults to 'public' — popup config does NOT copy public/ here.
  // Instead, the `copy:public` npm script runs after all builds: cp -r public/. dist/
  // This avoids race conditions between emptyOutDir and the copy step.
  publicDir: false,
  root: resolve(__dirname, 'src/popup'),
  build: {
    outDir: resolve(__dirname, 'dist/popup'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/popup/index.html'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
});
