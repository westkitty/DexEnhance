import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('popup renders DexEnhance brand heading', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('DexEnhance');
  await expect(page.locator('.tips strong')).toHaveText('Quick tips');
});

test('popup renders all four feature cards', async ({ page }) => {
  await expect(page.locator('.feature-card')).toHaveCount(4);
  await expect(page.locator('.feature-card h3').nth(0)).toHaveText('Command Palette');
  await expect(page.locator('.feature-card h3').nth(1)).toHaveText('Single Drawer');
  await expect(page.locator('.feature-card h3').nth(2)).toHaveText('Prompt + Folder Workspace');
  await expect(page.locator('.feature-card h3').nth(3)).toHaveText('Undo-first Actions');
});

test('popup renders Settings and Open Home buttons', async ({ page }) => {
  await expect(page.locator('#open-settings')).toBeVisible();
  await expect(page.locator('#open-home')).toBeVisible();
});

test('popup no longer exposes legacy Tour controls', async ({ page }) => {
  await expect(page.locator('#open-tour')).toHaveCount(0);
  await expect(page.locator('#tour-modal')).toHaveCount(0);
});

test('settings button opens modal with theme presets', async ({ page }) => {
  await page.click('#open-settings');
  await expect(page.locator('#settings-modal')).toHaveClass(/is-open/);
  await expect(page.locator('[data-theme-preset="graphite"]')).toBeVisible();
  await expect(page.locator('[data-theme-preset="paper"]')).toBeVisible();
  await expect(page.locator('[data-theme-preset="oxide"]')).toBeVisible();
});

test('settings close button dismisses modal', async ({ page }) => {
  await page.click('#open-settings');
  await page.click('#settings-close');
  await expect(page.locator('#settings-modal')).not.toHaveClass(/is-open/);
});

test('escape key dismisses open settings modal', async ({ page }) => {
  await page.click('#open-settings');
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-modal')).not.toHaveClass(/is-open/);
});

test('open home button reports preview context fallback', async ({ page }) => {
  await page.click('#open-home');
  await expect(page.locator('#popup-status-summary')).toContainText('Preview mode');
});
