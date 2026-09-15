/**
 * Centralized Application Version & Metadata Configuration for Spendly
 * SPENDLY V3.1.3
 */

export const APP_VERSION = '3.1.3';
export const APP_BUILD_DATE = '15 September 2026';
export const APP_NAME = 'Spendly';
export const APP_PACKAGE_ID = 'com.spendly.finance';

export const ANDROID_APK_DOWNLOAD_URL =
  'https://drive.google.com/file/d/1KkB6VGJV_Z2kpXa2_bi3X6oUZRSEShh0/view?usp=sharing';

export const APP_RELEASE_NOTES = [
  'Fixed offline & online CSV export with full transaction fields and UTF-8 BOM encoding',
  'Added visual map picker ("Pick on Map") with place search and location confirmation',
  'Preserved Unknown Location coordinates and interactive map markers',
  'Fixed Android location permission prompt and current location flow',
  'Fixed Android notification icon rendering with sharp monochrome Spendly symbol',
  'Configured authentication redirects for finance-spendly.vercel.app with dedicated /update-password page',
];
