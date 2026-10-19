import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, chmodSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';

const script = resolve('scripts/release-safety.mjs');
const directories: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'gbbox-release-'));
  directories.push(root);
  mkdirSync(join(root, 'src-tauri'));
  writeFileSync(join(root, 'VERSION'), '0.6.7\n');
  writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '0.6.7' }));
  writeFileSync(join(root, 'package-lock.json'), JSON.stringify({ version: '0.6.7', packages: { '': { version: '0.6.7' } } }));
  writeFileSync(join(root, 'src-tauri/tauri.conf.json'), JSON.stringify({ version: '0.6.7' }));
  writeFileSync(join(root, 'src-tauri/Cargo.toml'), '[package]\nname = "gamebasebox"\nversion = "0.6.7"\n');
  writeFileSync(join(root, 'src-tauri/Cargo.lock'), 'version = 3\n[[package]]\nname = "gamebasebox"\nversion = "0.6.7"\n');
  writeFileSync(join(root, 'RELEASE_NOTES_0.6.7.md'), 'Changes\n');
  return root;
}
function run(root: string, ...args: string[]) {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
}
afterEach(() => { for (const root of directories.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe('release version preflight', () => {
  it('accepts matching sources and tag, and permits manual validation without a tag', () => {
    const root = fixture();
    expect(run(root, 'versions', 'v0.6.7').status).toBe(0);
    expect(run(root, 'versions').status).toBe(0);
  });
  it.each(['v0.6.8', '0.6.7', 'v0.6.7-preview'])('rejects mismatched tag %s', (tag) => {
    const result = run(fixture(), 'versions', tag);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Tag');
  });
  it.each(['package.json', 'package-lock.json', 'src-tauri/tauri.conf.json', 'src-tauri/Cargo.toml', 'src-tauri/Cargo.lock'])('rejects version drift in %s', (file) => {
    const root = fixture();
    const path = join(root, file);
    writeFileSync(path, readFileSync(path, 'utf8').replaceAll('0.6.7', '0.6.8'));
    const result = run(root, 'versions', 'v0.6.7');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(file);
  });
  it('requires release notes for a tagged run', () => {
    const root = fixture();
    rmSync(join(root, 'RELEASE_NOTES_0.6.7.md'));
    expect(run(root, 'versions').status).toBe(0);
    expect(run(root, 'versions', 'v0.6.7').status).toBe(1);
  });
});

const assets = [
  ['windows', 'GBBox-Windows-x64-Setup.exe'],
  ['linux', 'GBBox-Linux.AppImage'],
  ['macos', 'GBBox-macOS.dmg'],
];
function bundles() {
  const root = fixture();
  mkdirSync(join(root, 'release-assets'));
  for (const [platform, name] of assets) {
    writeFileSync(join(root, 'release-assets', name), `synthetic ${platform} bundle`);
    expect(run(root, 'checksum', 'release-assets', platform).status).toBe(0);
  }
  return root;
}
describe('release asset verification', () => {
  it('verifies all three bundles and emits deterministic SHA256SUMS', () => {
    const root = bundles();
    expect(run(root, 'verify', 'release-assets').status).toBe(0);
    const expected = assets.map(([, name]) => `${createHash('sha256').update(readFileSync(join(root, 'release-assets', name))).digest('hex')}  ${name}\n`).join('');
    expect(readFileSync(join(root, 'release-assets/SHA256SUMS'), 'utf8')).toBe(expected);
  });
  it.each(assets)('rejects a missing %s bundle', (_platform, name) => {
    const root = bundles();
    rmSync(join(root, 'release-assets', name));
    expect(run(root, 'verify', 'release-assets').status).toBe(1);
  });
  it('rejects corrupted bytes, a missing checksum, empty files and unexpected uploads', () => {
    for (const defect of ['corrupt', 'checksum', 'empty', 'extra', 'manifest']) {
      const root = bundles();
      const file = join(root, 'release-assets', assets[0][1]);
      if (defect === 'corrupt') writeFileSync(file, 'corrupted');
      if (defect === 'checksum') rmSync(`${file}.sha256`);
      if (defect === 'empty') writeFileSync(file, '');
      if (defect === 'extra') writeFileSync(join(root, 'release-assets/private.txt'), 'unexpected');
      if (defect === 'manifest') writeFileSync(join(root, 'release-assets/SHA256SUMS'), 'invalid');
      expect(run(root, 'verify', 'release-assets').status, defect).toBe(1);
    }
  });
});

function appdir() {
  const root = fixture();
  mkdirSync(join(root, 'usr/bin'), { recursive: true });
  writeFileSync(join(root, 'AppRun'), '#!/bin/sh\n');
  writeFileSync(join(root, 'usr/bin/gamebasebox'), 'executable');
  chmodSync(join(root, 'AppRun'), 0o755);
  chmodSync(join(root, 'usr/bin/gamebasebox'), 0o755);
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  writeFileSync(join(root, '.DirIcon'), png);
  writeFileSync(join(root, 'gamebasebox.png'), png);
  writeFileSync(join(root, 'GBBox.desktop'), '[Desktop Entry]\nType=Application\nName=GBBox\nExec=gamebasebox\nIcon=gamebasebox\n');
  return root;
}

describe('AppDir validation', () => {
  it('accepts a portable AppDir', () => {
    expect(run(appdir(), 'appdir', '.').status).toBe(0);
  });
  it.each(['.DirIcon', 'AppRun', 'GBBox.desktop', 'gamebasebox.png', 'usr/bin/gamebasebox'])('rejects missing %s', (name) => {
    const root = appdir();
    rmSync(join(root, name));
    const result = run(root, 'appdir', '.');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(name);
  });
  it('rejects an invalid icon', () => {
    const root = appdir();
    writeFileSync(join(root, '.DirIcon'), 'not an icon');
    expect(run(root, 'appdir', '.').stderr).toContain('PNG');
  });
  it.skipIf(process.platform === 'win32')('rejects a build-machine icon link even when its target exists', () => {
    const root = appdir();
    rmSync(join(root, '.DirIcon'));
    symlinkSync(join(root, 'gamebasebox.png'), join(root, '.DirIcon'));
    expect(run(root, 'appdir', '.').stderr).toContain('relative');
  });
  it.skipIf(process.platform === 'win32')('accepts relative icon links and rejects dangling links', () => {
    const root = appdir();
    rmSync(join(root, '.DirIcon'));
    symlinkSync('gamebasebox.png', join(root, '.DirIcon'));
    expect(run(root, 'appdir', '.').status).toBe(0);
    rmSync(join(root, 'gamebasebox.png'));
    expect(run(root, 'appdir', '.').status).toBe(1);
  });
  it.skipIf(process.platform === 'win32')('rejects a non-executable AppRun', () => {
    const root = appdir();
    chmodSync(join(root, 'AppRun'), 0o644);
    expect(run(root, 'appdir', '.').stderr).toContain('executable');
  });
});
