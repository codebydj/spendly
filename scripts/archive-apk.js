import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Get current version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

const releasesDir = path.join(rootDir, 'android', 'releases');
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

// Check built APK sources
const apkDir = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release');
const candidateApks = [
  path.join(apkDir, `spendly-v${version}.apk`),
  path.join(apkDir, `app-release.apk`),
];

let sourceApk = candidateApks.find((p) => fs.existsSync(p));

if (!sourceApk) {
  // Try finding any .apk file in the release folder
  if (fs.existsSync(apkDir)) {
    const files = fs.readdirSync(apkDir);
    const apkFile = files.find((f) => f.endsWith('.apk') && !f.endsWith('-unsigned.apk'));
    if (apkFile) {
      sourceApk = path.join(apkDir, apkFile);
    }
  }
}

if (sourceApk && fs.existsSync(sourceApk)) {
  const targetApk = path.join(releasesDir, `spendly-v${version}.apk`);
  fs.copyFileSync(sourceApk, targetApk);
  console.log(`📦 APK archived to: ${targetApk}`);
} else {
  console.error(`⚠️ Source release APK not found in ${apkDir}`);
}
