import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const windowsLaunchers = ['tauri-dev.bat', 'tauri-dev-debug.bat'];
const unixLaunchers = ['tauri-dev.sh', 'tauri-dev-debug.sh'];

describe('Tauri development launchers', () => {
  it.each(windowsLaunchers)('%s waits for an HTTP-ready frontend without batch subroutines', (launcher) => {
    const script = readFileSync(join(process.cwd(), launcher), 'utf8');

    expect(script).not.toContain('call :');
    expect(script).not.toContain(':wait_for_frontend');
    expect(script).toContain('Invoke-WebRequest -UseBasicParsing -Uri \'http://127.0.0.1:3000/\' -TimeoutSec 2');
    expect(script).toContain('$attempt -le 30');
    expect(script).toMatch(/\$attempt -le 30[\s\S]*npx tauri dev/);
  });

  it.each(unixLaunchers)('%s waits for an HTTP-ready frontend rather than a fixed delay', (launcher) => {
    const script = readFileSync(join(process.cwd(), launcher), 'utf8');

    expect(script).toContain('curl -fsS --max-time 2 http://127.0.0.1:3000/');
    expect(script).toContain('for attempt in $(seq 1 30)');
    expect(script).not.toContain('sleep 5');
  });
});
