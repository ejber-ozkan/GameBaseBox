import { test, expect, type Page } from '@playwright/test';
import { waitForAppReady } from './test-helpers';

// The game details page is designed to fit the window. Regression cover for the
// Windows (WebView2, 100% scaling) bug where the extras screenshot sat below the fold
// and the whole document had to be scrolled.
const themes = ['default', 'c64-edition', 'arcade-void', 'cyberpunk-crt'] as const;
const viewports = [
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
];

async function documentOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
  );
}

for (const theme of themes) {
  for (const viewport of viewports) {
    test(`${theme} details and extras fit ${viewport.width}x${viewport.height} without page scrolling`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((themeId) => {
        window.localStorage.setItem(
          'gb64_settings',
          JSON.stringify(themeId === 'default' ? { isFullscreen: true } : { themeId, isFullscreen: true }),
        );
      }, theme);

      await page.goto('/');
      await waitForAppReady(page);
      await page.getByText('Commando').first().click();
      await expect(page.getByTestId('detail-view')).toBeVisible();
      expect(await documentOverflow(page)).toBeLessThanOrEqual(0);

      await page.getByRole('button', { name: /^Extras/ }).first().click();
      const fullscreenButton = page.getByRole('button', { name: /fullscreen/i }).first();
      await expect(fullscreenButton).toBeVisible();
      expect(await documentOverflow(page)).toBeLessThanOrEqual(0);

      // The screenshot preview must start inside the window, not below the fold.
      const box = await fullscreenButton.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    });
  }
}
