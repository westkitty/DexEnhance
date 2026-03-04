import { test, expect } from '@playwright/test';

// Phase 4/10: Popup UI — onboarding tour, settings modal, brand rendering
// Targets preview server at http://localhost:5179 (dist/ root)
//
// The tour auto-opens on every page load: maybeAutoOpenTour() calls
// sendRuntimeMessage(), which catches the chrome API rejection from the
// non-extension context, returns { ok: false }, and the condition
// (!state.ok || state.data !== TOUR_VERSION) opens the tour modal.

/** Helper: wait for and close the tour modal */
async function closeTour(page) {
  await page.waitForSelector('#tour-modal.is-open', { timeout: 5000 });
  await page.click('#tour-close');
  await expect(page.locator('#tour-modal')).not.toHaveClass(/is-open/);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Brand & Layout ─────────────────────────────────────────────────────────

test('popup renders DexEnhance brand heading', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('DexEnhance');
});

test('popup renders all four feature cards', async ({ page }) => {
  await expect(page.locator('.feature-card')).toHaveCount(4);
  await expect(page.locator('.feature-card h3').first()).toBeVisible();
});

test('popup renders Settings and Tour buttons', async ({ page }) => {
  // Buttons are present in DOM even when the tour modal is overlaid
  await expect(page.locator('#open-settings')).toBeAttached();
  await expect(page.locator('#open-tour')).toBeAttached();
});

// ── Tour modal (auto-opens on first load) ──────────────────────────────────

test('tour modal auto-opens on first load', async ({ page }) => {
  await expect(page.locator('#tour-modal')).toHaveClass(/is-open/, { timeout: 5000 });
});

test('tour modal shows step 1 of N progress pill', async ({ page }) => {
  await page.waitForSelector('#tour-modal.is-open', { timeout: 5000 });
  await expect(page.locator('#tour-progress')).toContainText('Step 1');
});

test('tour modal displays a non-empty step title', async ({ page }) => {
  await page.waitForSelector('#tour-modal.is-open', { timeout: 5000 });
  await expect(page.locator('#tour-title')).not.toBeEmpty();
});

test('tour modal displays a non-empty step description', async ({ page }) => {
  await page.waitForSelector('#tour-modal.is-open', { timeout: 5000 });
  await expect(page.locator('#tour-desc')).not.toBeEmpty();
});

test('tour Back button is disabled on step 1', async ({ page }) => {
  await page.waitForSelector('#tour-modal.is-open', { timeout: 5000 });
  await expect(page.locator('#tour-back')).toBeDisabled();
});

test('tour Next button advances to step 2', async ({ page }) => {
  await page.waitForSelector('#tour-modal.is-open', { timeout: 5000 });
  await page.click('#tour-next');
  await expect(page.locator('#tour-progress')).toContainText('Step 2');
});

test('tour Back button is enabled after advancing to step 2', async ({ page }) => {
  await page.waitForSelector('#tour-modal.is-open', { timeout: 5000 });
  await page.click('#tour-next');
  await expect(page.locator('#tour-back')).toBeEnabled();
});

test('tour Back button returns to step 1', async ({ page }) => {
  await page.waitForSelector('#tour-modal.is-open', { timeout: 5000 });
  await page.click('#tour-next');  // → step 2
  await page.click('#tour-back');  // → step 1
  await expect(page.locator('#tour-progress')).toContainText('Step 1');
});

test('tour Close button dismisses the modal', async ({ page }) => {
  await page.waitForSelector('#tour-modal.is-open', { timeout: 5000 });
  await page.click('#tour-close');
  await expect(page.locator('#tour-modal')).not.toHaveClass(/is-open/);
});

test('Escape key dismisses the open tour modal', async ({ page }) => {
  await page.waitForSelector('#tour-modal.is-open', { timeout: 5000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#tour-modal')).not.toHaveClass(/is-open/);
});

test('Tour button re-opens the tour after it was closed', async ({ page }) => {
  await closeTour(page);
  await page.click('#open-tour');
  await expect(page.locator('#tour-modal')).toHaveClass(/is-open/);
});

// ── Settings modal ─────────────────────────────────────────────────────────

test('Settings button opens the settings modal', async ({ page }) => {
  await closeTour(page);
  await page.click('#open-settings');
  await expect(page.locator('#settings-modal')).toHaveClass(/is-open/);
});

test('Settings modal Close button dismisses it', async ({ page }) => {
  await closeTour(page);
  await page.click('#open-settings');
  await page.waitForSelector('#settings-modal.is-open', { timeout: 3000 });
  await page.click('#settings-close');
  await expect(page.locator('#settings-modal')).not.toHaveClass(/is-open/);
});

test('Escape key dismisses the open settings modal', async ({ page }) => {
  await closeTour(page);
  await page.click('#open-settings');
  await page.waitForSelector('#settings-modal.is-open', { timeout: 3000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-modal')).not.toHaveClass(/is-open/);
});

test('settings modal contains HUD hue slider', async ({ page }) => {
  await closeTour(page);
  await page.click('#open-settings');
  await page.waitForSelector('#settings-modal.is-open', { timeout: 3000 });
  await expect(page.locator('#hud-hue')).toBeVisible();
});
