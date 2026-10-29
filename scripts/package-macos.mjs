import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import packager from '@electron/packager';

const arch = process.argv[2];
const version = process.argv[3];
if (process.platform !== 'darwin' || !['arm64', 'x64'].includes(arch) || !/^\d+\.\d+\.\d+$/.test(version ?? '')) throw new Error('Run on macOS: node scripts/package-macos.mjs arm64|x64 1.0.0');
await readFile('dist/client/index.html'); // Fail rather than publish a blank desktop app.
const stage = path.join(os.tmpdir(), `bryteinbox-stage-${arch}`);
const output = path.join(os.tmpdir(), `bryteinbox-package-${arch}`);
await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
await cp('electron', path.join(stage, 'electron'), { recursive: true });
await rm(path.join(stage, 'electron', 'security.test.cjs'));
await rm(path.join(stage, 'electron', 'local-server.test.cjs'));
await cp('dist/client', path.join(stage, 'web'), { recursive: true });
await writeFile(path.join(stage, 'package.json'), JSON.stringify({ name: 'bryteinbox', productName: 'BryteInbox', version, main: 'electron/main.cjs' }));
const electronVersion = JSON.parse(await readFile('node_modules/electron/package.json', 'utf8')).version;
const iconset = path.join(stage, 'BryteInbox.iconset');
await mkdir(iconset);
for (const size of [16, 32, 128, 256, 512]) {
  execFileSync('sips', ['-z', String(size), String(size), 'public/icon-512.png', '--out', path.join(iconset, `icon_${size}x${size}.png`)]);
  execFileSync('sips', ['-z', String(size * 2), String(size * 2), 'public/icon-512.png', '--out', path.join(iconset, `icon_${size}x${size}@2x.png`)]);
}
const icon = path.join(os.tmpdir(), `bryteinbox-${arch}.icns`);
execFileSync('iconutil', ['-c', 'icns', iconset, '-o', icon]);
await rm(iconset, { recursive: true });
const paths = await packager({ dir: stage, out: output, name: 'BryteInbox', platform: 'darwin', arch, electronVersion, appVersion: version, appBundleId: 'studio.nestamedia.bryteinbox', icon, overwrite: true, prune: false });
await mkdir('release', { recursive: true });
const appPath = path.join(paths[0], 'BryteInbox.app');
execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath]);
execFileSync('codesign', ['--verify', '--deep', '--strict', appPath]);
if (arch === process.arch) {
  execFileSync(path.join(appPath, 'Contents', 'MacOS', 'BryteInbox'), ['--smoke-test'], { timeout: 45000, stdio: 'inherit' });
}
execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', appPath, `release/BryteInbox-${version}-macOS-${arch}.zip`]);
await rm(stage, { recursive: true, force: true });