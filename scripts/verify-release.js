import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 RUNNING SPENDLY RELEASE AUDIT & VERIFICATION SCRIPT...');

let errors = [];

// 1. Check package.json version
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
if (packageJson.version !== '3.1.3') {
  errors.push(`package.json version is '${packageJson.version}', expected '3.1.3'`);
} else {
  console.log('✅ package.json version: 3.1.3');
}

// 2. Check appVersion.ts
const appVersionTs = fs.readFileSync(path.join(rootDir, 'src', 'config', 'appVersion.ts'), 'utf8');
if (!appVersionTs.includes("export const APP_VERSION = '3.1.3';")) {
  errors.push("src/config/appVersion.ts does not contain export const APP_VERSION = '3.1.3';");
} else {
  console.log('✅ src/config/appVersion.ts APP_VERSION: 3.1.3');
}

// 3. Check public/app-version.json
const publicAppVersion = JSON.parse(fs.readFileSync(path.join(rootDir, 'public', 'app-version.json'), 'utf8'));
if (publicAppVersion.version !== '3.1.3') {
  errors.push(`public/app-version.json version is '${publicAppVersion.version}', expected '3.1.3'`);
} else {
  console.log('✅ public/app-version.json version: 3.1.3');
}

// 4. Check android/app/build.gradle
const buildGradle = fs.readFileSync(path.join(rootDir, 'android', 'app', 'build.gradle'), 'utf8');
if (!buildGradle.includes('versionName "3.1.3"')) {
  errors.push("android/app/build.gradle does not contain versionName \"3.1.3\"");
} else {
  console.log('✅ android/app/build.gradle versionName: 3.1.3');
}

if (!buildGradle.includes('versionCode 313')) {
  errors.push("android/app/build.gradle does not contain versionCode 313");
} else {
  console.log('✅ android/app/build.gradle versionCode: 313');
}

if (!buildGradle.includes('applicationId "com.spendly.finance"')) {
  errors.push("android/app/build.gradle does not contain applicationId \"com.spendly.finance\"");
} else {
  console.log('✅ android/app/build.gradle applicationId: com.spendly.finance');
}

// 5. Check notification drawable icon presence
const drawables = [
  'drawable',
  'drawable-mdpi',
  'drawable-hdpi',
  'drawable-xhdpi',
  'drawable-xxhdpi',
  'drawable-xxxhdpi',
];

drawables.forEach((d) => {
  const p = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', d, 'ic_stat_spendly.png');
  if (!fs.existsSync(p)) {
    errors.push(`Notification icon missing: ${p}`);
  }
});
console.log('✅ Native Android notification drawables (ic_stat_spendly.png) verified');

// 6. Check capacitor.config.ts
const capConfig = fs.readFileSync(path.join(rootDir, 'capacitor.config.ts'), 'utf8');
if (!capConfig.includes("smallIcon: 'ic_stat_spendly'")) {
  errors.push("capacitor.config.ts does not configure smallIcon: 'ic_stat_spendly'");
} else {
  console.log('✅ capacitor.config.ts smallIcon: ic_stat_spendly');
}

// 7. Check web build assets & sync
const distDir = path.join(rootDir, 'dist');
const androidAssetsDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets', 'public');

if (fs.existsSync(distDir)) {
  console.log('✅ dist/ directory exists');
} else {
  errors.push('dist/ directory does not exist. Run npm run build');
}

if (fs.existsSync(androidAssetsDir)) {
  console.log('✅ android/app/src/main/assets/public/ synced directory exists');
} else {
  errors.push('android/app/src/main/assets/public/ directory does not exist. Run npx cap sync android');
}

// 8. Verify no old production preview URLs in active TypeScript source files
const authConfig = fs.readFileSync(path.join(rootDir, 'src', 'utils', 'authConfig.ts'), 'utf8');
if (authConfig.includes('spendly-djs-projects-5332e418.vercel.app')) {
  errors.push('Found obsolete preview URL spendly-djs-projects-5332e418.vercel.app in src/utils/authConfig.ts');
} else {
  console.log('✅ Canonical production domain https://finance-spendly.vercel.app verified');
}

console.log('--------------------------------------------------');
if (errors.length > 0) {
  console.error('❌ RELEASE AUDIT FAILED WITH THE FOLLOWING ERRORS:');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log('🎉 SPENDLY V3.1.3 FULL AUDIT PASSED! READY FOR PRODUCTION RELEASE BUILD.');
}
