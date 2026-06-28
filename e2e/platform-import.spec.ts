import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-helpers';

test.describe('Platform import routing', () => {
  test('routes an unimported Atari 800 platform to MDB and folder setup', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    await expect(page.getByLabel('Active platform')).toBeVisible();
    await page.getByLabel('Active platform').selectOption('atari800');

    await expect(page.getByRole('heading', { name: /Build Your Atari 800 Database/i })).toBeVisible();
    await expect(page.getByText('Atari 800 has not been imported yet.')).toBeVisible();
    await expect(page.getByText('Games')).toBeVisible();
    await expect(page.getByText('Music')).toBeVisible();
    await expect(page.getByText('Photos')).toBeVisible();
    await expect(page.getByText('Screenshots')).toBeVisible();
    await expect(page.getByRole('button', { name: /Build Database/i })).toBeDisabled();
  });
});
