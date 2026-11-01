import { accessSync, constants, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Tauri build scripts', () => {
  it('tauri-build.sh exists and is executable', () => {
    const scriptPath = join(process.cwd(), 'tauri-build.sh');
    expect(() => accessSync(scriptPath, constants.X_OK)).not.toThrow();
  });

  it('tauri-build.sh configures PATH and executes tauri build', () => {
    const script = readFileSync(join(process.cwd(), 'tauri-build.sh'), 'utf8');

    expect(script).toContain('.cargo/bin');
    expect(script).toContain('node_modules');
    expect(script).toContain('npm install');
    expect(script).toContain('npx tauri build');
  });

  it('tauri-build.bat configures PATH and executes tauri build', () => {
    const script = readFileSync(join(process.cwd(), 'tauri-build.bat'), 'utf8');

    expect(script).toContain('.cargo\\bin');
    expect(script).toContain('npm install');
    expect(script).toContain('npx tauri build');
  });
});
