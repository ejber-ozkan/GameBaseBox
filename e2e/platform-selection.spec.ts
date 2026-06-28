import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-helpers';

test('platform switcher routes an unimported Atari 800 selection to setup', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  await expect(page.getByLabel('Active platform')).toBeVisible();
  await page.getByLabel('Active platform').selectOption('atari800');

  await expect(page.getByRole('heading', { name: /Build Your Atari 800 Database/ })).toBeVisible();
  await expect(page.getByText('Atari 800 has not been imported yet.')).toBeVisible();
});
