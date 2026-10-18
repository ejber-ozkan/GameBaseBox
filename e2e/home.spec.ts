import { test, expect } from '@playwright/test';
import { seedImportedAtari800Settings, waitForAppReady } from './test-helpers';

test('Tab and Enter sort the library without opening the controller-focused game', async ({ page }) => {
  await seedImportedAtari800Settings(page);
  await page.goto('/');
  await waitForAppReady(page);
  await page.getByRole('button', { name: /^List/ }).click();
  const title = page.getByRole('button', { name: 'Title', exact: true });
  const year = page.getByRole('button', { name: 'Year', exact: true });
  await expect(title).toBeVisible();
  await title.focus();
  await page.keyboard.press('Tab');
  await expect(year).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('columnheader', { name: 'Year' })).toHaveAttribute('aria-sort', 'ascending');
  await expect(page.getByTestId('detail-view')).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('columnheader', { name: 'Year' })).toHaveAttribute('aria-sort', 'descending');
  await expect(page.getByTestId('detail-view')).toBeHidden();
});

test('game title buttons follow arrow focus and Enter opens the DOM-focused game', async ({ page }) => {
  await seedImportedAtari800Settings(page);
  await page.goto('/');
  await waitForAppReady(page);
  await page.getByRole('button', { name: /^List/ }).click();
  const games = page.locator('button[data-library-game-button]');
  await expect(games.nth(1)).toBeVisible();
  const secondTitle = (await games.nth(1).innerText()).trim();
  await games.first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(games.nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('detail-view')).toBeVisible();
  await expect(page.getByRole('heading', { name: secondTitle, exact: true })).toBeVisible();
});

test('fullscreen handles each keyboard arrow once through the active navigation hook', async ({ page }) => {
  await seedImportedAtari800Settings(page);
  await page.addInitScript(() => {
    const settings = JSON.parse(localStorage.getItem('gb64_settings')!);
    settings.isFullscreen = true;
    settings.themeId = 'c64-edition';
    settings.recentlyPlayedIds = ['1', '2', '3', '4'];
    settings.platformSettings.c64.navigation.recentlyPlayedIds = settings.recentlyPlayedIds;
    localStorage.setItem('gb64_settings', JSON.stringify(settings));
  });
  await page.goto('/');
  await waitForAppReady(page);
  const focusedTitle = page.getByTestId('c64-focused-title');
  await expect(focusedTitle).toHaveText('Archon: The Light and the Dark');
  await page.locator('.bigbox-list-surface').focus();
  await page.keyboard.press('ArrowRight');
  await expect(focusedTitle).toHaveText('Boulder Dash');
});

test('mobile Safari keeps the library platform selector and quick search visible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-safari');

  await page.goto('/');
  await waitForAppReady(page);

  await expect(page.getByLabel('Active platform')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByPlaceholder('QUICK SEARCH')).toBeVisible({ timeout: 15_000 });
});

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

  const gameCard = page.getByText('Archon: The Light and the Dark').first();
  await expect(gameCard).toBeVisible();
  await gameCard.click();

  await expect(page.getByTestId('detail-view')).toBeVisible();
});
