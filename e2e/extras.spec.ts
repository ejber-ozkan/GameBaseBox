import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-helpers';

test.describe('Extras Functionality', () => {
  test('opens the extras gallery for Commando and closes fullscreen preview', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    await page.getByPlaceholder('QUICK SEARCH').fill('Commando');
    await page.getByTitle('Commando').click();

    await page.getByRole('button', { name: 'Extras' }).click();
    const archivePosterButton = page.getByRole('button', { name: /archive poster/i }).first();
    await expect(archivePosterButton).toBeVisible();

    await archivePosterButton.click();

    await expect(page.locator('[data-detail-modal="open"]')).toBeVisible();
    await expect(page.getByText('Cover/commando-poster.png')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-detail-modal="open"]')).toBeHidden();
  });
});
