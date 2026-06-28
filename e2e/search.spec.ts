import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-helpers';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('search clears an active genre filter and shows matching results', async ({ page }) => {
    await page.getByRole('button', { name: 'Strategy' }).click();

    await expect(page.getByTitle('Archon: The Light and the Dark')).toBeVisible();
    await expect(page.getByTitle('Commando')).not.toBeVisible();

    const searchInput = page.getByPlaceholder('QUICK SEARCH');
    await searchInput.fill('Commando');

    await expect(page.getByTitle('Commando')).toBeVisible();
    await expect(page.getByTitle('Archon: The Light and the Dark')).not.toBeVisible();

    await searchInput.fill('');

    await expect(page.getByTitle('Archon: The Light and the Dark')).toBeVisible();
    await expect(page.getByTitle('Commando')).toBeVisible();
  });
});
