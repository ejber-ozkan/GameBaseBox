import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tauriConfig = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src-tauri/tauri.conf.json'), 'utf8'),
);

describe('Tauri packaging configuration', () => {
  test('allows jsSID to load generated blob URLs in packaged apps', () => {
    const csp: string = tauriConfig.app.security.csp;
    const connectSource = csp
      .split(';')
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith('connect-src '));

    expect(connectSource?.split(/\s+/)).toContain('blob:');
  });
});
