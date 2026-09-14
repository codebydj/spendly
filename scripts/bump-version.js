import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Bump patch version (e.g. 1.0.1 -> 1.0.2)
const versionParts = packageJson.version.split('.').map(Number);
versionParts[2] = (versionParts[2] || 0) + 1;
const newVersion = versionParts.join('.');
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

// 2. Read android/app/build.gradle
const buildGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

// Update versionCode (increment by 1)
let newVersionCode = 2;
buildGradle = buildGradle.replace(/versionCode\s+(\d+)/, (match, code) => {
  newVersionCode = parseInt(code, 10) + 1;
  return `versionCode ${newVersionCode}`;
});

// Update versionName
buildGradle = buildGradle.replace(/versionName\s+["']([^"']+)["']/, `versionName "${newVersion}"`);

fs.writeFileSync(buildGradlePath, buildGradle, 'utf8');

console.log(`🚀 Version auto-updated: v${newVersion} (versionCode: ${newVersionCode})`);
