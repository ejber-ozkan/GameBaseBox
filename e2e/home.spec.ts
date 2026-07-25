import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-helpers';

test('mobile Safari keeps the library platform selector and quick search visible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-safari');

  await page.goto('/');
  await waitForAppReady(page);

  await expect(page.getByLabel('Active platform')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByPlaceholder('QUICK SEARCH')).toBeVisible({ timeout: 15_000 });
});

test('bigbox keyboard navigation opens the focused game from fullscreen mode', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'gb64_settings',
      JSON.stringify({
        isFullscreen: true,
      }),
    );
  });

  await page.goto('/');
  await waitForAppReady(page);

  // Mobile Safari can render its condensed BigBox surface without the desktop
  // search control; Enter opening the focused game is the shared behavior.
  if (testInfo.project.name === 'chromium') {
    await expect(page.getByPlaceholder('QUICK SEARCH')).toBeVisible();
  }

  await page.keyboard.press('Enter');

  await expect(page.getByText('Archon: The Light and the Dark').first()).toBeVisible();
  if (testInfo.project.name === 'chromium') {
    await expect(page.getByTestId('detail-view')).toBeVisible();
  }
});
