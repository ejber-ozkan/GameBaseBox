import { createReadStream } from 'node:fs';
import { lstat, readFile, readdir, writeFile, realpath, readlink, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, relative, isAbsolute } from 'node:path';

const assets = {
  windows: 'GBBox-Windows-x64-Setup.exe',
  linux: 'GBBox-Linux.AppImage',
  macos: 'GBBox-macOS.dmg',
};
const read = (file) => readFile(file, 'utf8');
const json = async (file) => JSON.parse(await read(file));

async function versions(tag) {
  const version = (await read('VERSION')).trim();
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('VERSION must be a stable semantic version');
  if (tag !== undefined && tag !== `v${version}`) throw new Error(`Tag ${tag} does not match VERSION ${version}`);
  const lock = await json('package-lock.json');
  const cargo = (await read('src-tauri/Cargo.toml')).split(/^\[package\]\s*$/m)[1]?.split(/^\[/m)[0];
  const cargoLock = (await read('src-tauri/Cargo.lock')).split(/^\[\[package\]\]\s*$/m)
    .find((section) => /^name\s*=\s*"gamebasebox"\s*$/m.test(section));
  const tomlVersion = (section) => section?.match(/^version\s*=\s*"([^"]+)"\s*$/m)?.[1];
  const sources = {
    'package.json': (await json('package.json')).version,
    'package-lock.json': lock.version,
    'package-lock.json packages[root]': lock.packages?.['']?.version,
    'src-tauri/tauri.conf.json': (await json('src-tauri/tauri.conf.json')).version,
    'src-tauri/Cargo.toml': tomlVersion(cargo),
    'src-tauri/Cargo.lock': tomlVersion(cargoLock),
  };
  for (const [file, actual] of Object.entries(sources)) {
    if (actual !== version) throw new Error(`${file}: expected ${version}, found ${actual}`);
  }
  if (tag !== undefined && !(await read(`RELEASE_NOTES_${version}.md`)).trim()) {
    throw new Error('Release notes must not be empty');
  }
  console.log(`Validated version ${version}${tag === undefined ? ' (manual validation)' : ` and tag ${tag}`}`);
}

async function checksumLine(directory, name) {
  const file = join(directory, name);
  const stat = await lstat(file);
  if (!stat.isFile() || stat.size === 0) throw new Error(`Missing or empty regular bundle: ${name}`);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return `${hash.digest('hex')}  ${name}\n`;
}

async function checksum(directory, platform) {
  const name = assets[platform];
  if (!name) throw new Error(`Unknown platform: ${platform}`);
  await writeFile(join(directory, `${name}.sha256`), await checksumLine(directory, name));
}

async function verify(directory) {
  const names = Object.values(assets);
  const allowed = new Set([...names, ...names.map((name) => `${name}.sha256`), 'SHA256SUMS']);
  const entries = await readdir(directory);
  for (const name of entries) {
    if (!allowed.has(name)) throw new Error(`Unexpected release asset: ${name}`);
  }
  const lines = [];
  for (const name of names) {
    const expected = await checksumLine(directory, name);
    if (await read(join(directory, `${name}.sha256`)) !== expected) {
      throw new Error(`Checksum mismatch: ${name}`);
    }
    lines.push(expected);
  }
  const manifest = lines.join('');
  if (entries.includes('SHA256SUMS') && await read(join(directory, 'SHA256SUMS')) !== manifest) {
    throw new Error('SHA256SUMS does not match verified bundles');
  }
  await writeFile(join(directory, 'SHA256SUMS'), manifest);
  console.log('Verified all three release bundles and SHA256SUMS');
}

async function appdir(directory) {
  const root = await realpath(directory);
  async function file(name, executable = false) {
    const path = join(root, name);
    const entry = await lstat(path).catch(() => { throw new Error(`Missing AppDir file: ${name}`); });
    if (entry.isSymbolicLink() && isAbsolute(await readlink(path))) {
      throw new Error(`${name}: AppDir links must be relative`);
    }
    const target = await realpath(path).catch(() => { throw new Error(`Broken AppDir link: ${name}`); });
    const local = relative(root, target);
    if (local === '..' || local.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(local)) {
      throw new Error(`${name}: target escapes AppDir`);
    }
    const info = await stat(target);
    if (!info.isFile() || info.size === 0) throw new Error(`${name}: expected a nonempty file`);
    if (executable && process.platform !== 'win32' && !(info.mode & 0o111)) {
      throw new Error(`${name}: must be executable`);
    }
    return path;
  }
  async function png(name) {
    const bytes = await readFile(await file(name));
    if (!bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
      throw new Error(`${name}: expected a PNG icon`);
    }
  }
  await png('.DirIcon');
  await file('AppRun', true);
  const desktop = await read(await file('GBBox.desktop'));
  for (const line of ['[Desktop Entry]', 'Type=Application', 'Name=GBBox', 'Exec=gamebasebox', 'Icon=gamebasebox']) {
    if (!desktop.split(/\r?\n/).includes(line)) throw new Error(`GBBox.desktop: missing ${line}`);
  }
  await png('gamebasebox.png');
  await file('usr/bin/gamebasebox', true);
  console.log('Validated portable AppDir icon, desktop entry and executables');
}

try {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'versions' && args.length <= 1) await versions(...args);
  else if (command === 'checksum' && args.length === 2) await checksum(...args);
  else if (command === 'verify' && args.length === 1) await verify(...args);
  else if (command === 'appdir' && args.length === 1) await appdir(resolve(args[0]));
  else throw new Error('Usage: release-safety.mjs versions [tag] | checksum DIRECTORY PLATFORM | verify DIRECTORY | appdir DIRECTORY');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
