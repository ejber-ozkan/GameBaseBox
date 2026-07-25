import { test, expect } from '@playwright/test';
import { seedImportedAtari800Settings, waitForAppReady } from './test-helpers';

test.describe('Atari 800 launch settings', () => {
  test('shows RetroArch Atari800 and Altirra controls only from the Atari 800 platform paths tab', async ({ page }) => {
    await seedImportedAtari800Settings(page);

    await page.goto('/');
    await waitForAppReady(page);

    await page.getByTitle('Settings').click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    const c64Tab = page.getByRole('button', { name: /C64 Platform Paths/i });
    await c64Tab.scrollIntoViewIfNeeded();
    await c64Tab.click();

    const viceInput = page.getByPlaceholder('e.g. C:/VICE/x64sc.exe');
    await viceInput.scrollIntoViewIfNeeded();
    await expect(page.getByText('VICE Executable (x64sc.exe)')).toBeAttached();
    await expect(page.getByText('RetroArch Atari800 Core')).toBeHidden();
    await expect(page.getByText('Altirra Executable (Altirra64.exe)')).toBeHidden();

    const atari800Tab = page.getByRole('button', { name: /Atari 800 Platform Paths/i });
    await atari800Tab.scrollIntoViewIfNeeded();
    await atari800Tab.click();

    const retroarchCoreInput = page.getByPlaceholder('e.g. C:/RetroArch/cores/atari800_libretro.dll');
    await retroarchCoreInput.scrollIntoViewIfNeeded();
    await expect(page.getByText('RetroArch Atari800 Core')).toBeAttached();

    const altirraInput = page.getByPlaceholder('e.g. C:/Altirra/Altirra64.exe');
    await altirraInput.scrollIntoViewIfNeeded();
    await expect(page.getByText('Altirra Executable (Altirra64.exe)')).toBeAttached();

    await expect(retroarchCoreInput).toHaveValue(
      'C:/RetroArch/cores/atari800_libretro.dll',
    );
    await expect(altirraInput).toHaveValue(
      'C:/Altirra/Altirra64.exe',
    );
  });
});
