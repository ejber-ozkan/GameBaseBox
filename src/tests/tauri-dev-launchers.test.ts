import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const launchers = ['tauri-dev.bat', 'tauri-dev-debug.bat'];

describe('Tauri development launchers', () => {
  it.each(launchers)('%s waits for an HTTP-ready frontend before opening Tauri', (launcher) => {
    const script = readFileSync(join(process.cwd(), launcher), 'utf8');

    expect(script).toContain(':wait_for_frontend');
    expect(script).toContain('Invoke-WebRequest -UseBasicParsing -Uri \'http://127.0.0.1:3000/\' -TimeoutSec 2');
    expect(script).toMatch(/call :wait_for_frontend[\s\S]*npx tauri dev/);
  });
});
