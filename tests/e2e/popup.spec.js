import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('popup renders DexEnhance brand heading', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('DexEnhance');
  await expect(page.locator('.brand p')).toContainText('launcher and control surface');
});

test('popup exposes primary feature launchers', async ({ page }) => {
  await expect(page.locator('[data-open-surface="prompts"]')).toBeVisible();
  await expect(page.locator('[data-open-surface="queue"]')).toBeVisible();
  await expect(page.locator('[data-open-surface="optimizer"]')).toBeVisible();
  await expect(page.locator('[data-open-surface="context"]')).toBeVisible();
  await expect(page.locator('[data-open-surface="export"]')).toBeVisible();
  await expect(page.locator('[data-open-surface="tour"]')).toBeVisible();
});

test('popup includes quick shortcuts for hub workspace and canvas', async ({ page }) => {
  await expect(page.locator('[data-open-surface="hub"]')).toBeVisible();
  await expect(page.locator('[data-open-surface="workspace"]')).toBeVisible();
  await expect(page.locator('[data-open-surface="canvas"]')).toBeVisible();
});

test('settings modal exposes HUD customization and feature toggles', async ({ page }) => {
  await page.click('#open-settings');
  await expect(page.locator('#settings-modal')).toHaveClass(/is-open/);
  await expect(page.locator('#accent-hue')).toBeVisible();
  await expect(page.locator('#transparency')).toBeVisible();
  await expect(page.locator('#fab-size')).toBeVisible();
  await expect(page.locator('#fab-behavior')).toBeVisible();
  await expect(page.locator('#token-overlay-mode')).toBeVisible();
  await expect(page.locator('#feature-semanticClipboard')).toBeVisible();
  await expect(page.locator('#feature-popoutCanvas')).toBeVisible();
  await expect(page.locator('#feature-tokenOverlay')).toBeVisible();
});

test('settings modal exposes recovery and relaunch controls', async ({ page }) => {
  await page.click('#open-settings');
  await expect(page.locator('#recover-ui')).toBeVisible();
  await expect(page.locator('#reset-layout')).toBeVisible();
  await expect(page.locator('#reset-theme')).toBeVisible();
  await expect(page.locator('#relaunch-onboarding')).toBeVisible();
  await expect(page.locator('#relaunch-tour')).toBeVisible();
});

test('settings close button dismisses modal', async ({ page }) => {
  await page.click('#open-settings');
  await page.click('#settings-close');
  await expect(page.locator('#settings-modal')).not.toHaveClass(/is-open/);
});

test('open hub button reports preview context fallback', async ({ page }) => {
  await page.click('#open-home');
  await expect(page.locator('#popup-status-summary')).toContainText('Preview mode');
});
