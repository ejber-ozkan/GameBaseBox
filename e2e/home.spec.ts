import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-helpers';

test('bigbox keyboard navigation opens the focused game from fullscreen mode', async ({ page }) => {
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

  await expect(page.getByPlaceholder('QUICK SEARCH')).toBeVisible();

  await page.keyboard.press('Enter');

  await expect(page.getByText('Archon: The Light and the Dark').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Game' })).toBeVisible();
});
