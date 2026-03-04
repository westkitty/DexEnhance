import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 15000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5179',
    headless: true,
    viewport: { width: 400, height: 600 },
  },
  reporter: [['list']],
});
