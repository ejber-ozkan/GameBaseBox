import { test, expect } from '@playwright/test';
import { seedImportedAtari800Settings, waitForAppReady } from './test-helpers';

test.describe('Atari 800 launch settings', () => {
  test('shows RetroArch Atari800 and Altirra controls only from the Atari 800 platform paths tab', async ({ page }) => {
    await seedImportedAtari800Settings(page);

    await page.goto('/');
    await waitForAppReady(page);

    await page.getByTitle('Settings').click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    await page.getByRole('button', { name: /C64 Platform Paths/i }).click();
    await expect(page.getByText('VICE Executable (x64sc.exe)')).toBeVisible();
    await expect(page.getByText('RetroArch Atari800 Core')).toBeHidden();
    await expect(page.getByText('Altirra Executable (Altirra64.exe)')).toBeHidden();

    await page.getByRole('button', { name: /Atari 800 Platform Paths/i }).click();
    await expect(page.getByText('RetroArch Atari800 Core')).toBeVisible();
    await expect(page.getByText('Altirra Executable (Altirra64.exe)')).toBeVisible();
    await expect(page.getByText('RetroArch Atari800 Core').locator('..').getByRole('textbox')).toHaveValue(
      'C:/RetroArch/cores/atari800_libretro.dll',
    );
    await expect(page.getByText('Altirra Executable (Altirra64.exe)').locator('..').getByRole('textbox')).toHaveValue(
      'C:/Altirra/Altirra64.exe',
    );
  });
});
