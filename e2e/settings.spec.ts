import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-helpers';

test.describe('Settings Management', () => {
  test('saves the extras path and restores it after a reload', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    await page.getByTitle('Settings').click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    await page.getByRole('button', { name: /C64 Platform Paths/i }).click();
    const extrasFolderInput = page.getByText('Extras folder').locator('..').getByRole('textbox');
    await extrasFolderInput.fill('/tmp/gb64-e2e-extras');

    await page.getByRole('button', { name: 'Save Configuration' }).click();
    await expect(page.getByText('GBBox')).toBeVisible();

    await page.reload();
    await waitForAppReady(page);

    await page.getByTitle('Settings').click();
    await page.getByRole('button', { name: /C64 Platform Paths/i }).click();
    await expect(page.getByText('Extras folder').locator('..').getByRole('textbox')).toHaveValue('/tmp/gb64-e2e-extras');
  });
});
