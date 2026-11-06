import { test, expect } from '@playwright/test';
import { seedImportedAtari800Settings, waitForAppReady } from './test-helpers';

test.describe('Platform reimport', () => {
  test('warns, opens the import page for the platform, and returns to the library without changes', async ({ page }) => {
    await seedImportedAtari800Settings(page);
    await page.goto('/');
    await waitForAppReady(page);

    await page.getByTitle('Settings').click();
    const atari800Tab = page.getByRole('button', { name: /Atari 800 Platform Paths/i });
    await atari800Tab.scrollIntoViewIfNeeded();
    await atari800Tab.click();

    const reimportButton = page.getByRole('button', { name: 'Reimport MDB…' });
    await reimportButton.scrollIntoViewIfNeeded();
    await reimportButton.click();

    const dialog = page.getByTestId('reimport-confirm-dialog');
    await expect(dialog.getByRole('heading', { name: 'Reimport Atari 800?' })).toBeVisible();

    // Cancelling keeps the user in Settings.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    await reimportButton.click();
    await dialog.getByRole('button', { name: 'Continue to Import' }).click();

    await expect(page.getByRole('heading', { name: 'Reimport Atari 800' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Build Database' })).toBeVisible();
    // The launch splash is not replayed when the library comes back.
    await page.getByRole('button', { name: /Back to Library/ }).click();
    await expect(page.getByRole('heading', { name: 'Reimport Atari 800' })).toBeHidden();
    await expect(page.locator('.app-launch-splash')).toHaveCount(0);
    await waitForAppReady(page);

    // Back returns to the platform that was active before (C64), not the reimported one.
    await page.getByTitle('Settings').click();
    await expect(page.getByRole('button', { name: /C64 Platform Paths/i })).toBeVisible();
    await expect.poll(() => page.evaluate(
      () => JSON.parse(localStorage.getItem('gb64_settings') ?? '{}').activePlatformId,
    )).toBe('c64');
  });
});
