import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { AppVersionManifest } from '../types/finance';
import { APP_VERSION, APP_BUILD_DATE } from '../config/appVersion';
import { PRODUCTION_SITE_URL } from './authConfig';

export const CURRENT_APP_VERSION = APP_VERSION;
export const CURRENT_RELEASE_DATE = APP_BUILD_DATE;

const POSTPONED_UNTIL_KEY = 'spendly_update_postponed_until';
const CACHED_MANIFEST_KEY = 'spendly_cached_version_manifest';

export type UpdateCheckResult =
  | {
      status: 'update_available';
      currentVersion: string;
      latestVersion: string;
      manifest: AppVersionManifest;
    }
  | {
      status: 'up_to_date';
      currentVersion: string;
      latestVersion: string;
      manifest: AppVersionManifest;
    }
  | {
      status: 'offline';
      currentVersion: string;
      message: string;
    }
  | {
      status: 'error';
      currentVersion: string;
      message: string;
    };

/**
 * Dynamically read the actual installed app version from the device runtime.
 * On Android / native Capacitor runtime: reads versionName from App.getInfo() (e.g. "3.0.8", "3.1.2", "3.1.3").
 * On Web: returns the configured APP_VERSION ("3.1.3").
 */
export async function getInstalledAppVersion(): Promise<string> {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const info = await App.getInfo();
      if (info && info.version) {
        return info.version.replace(/^v/i, '').trim();
      }
    } catch (e) {
      console.warn('[VersionCheck] Native App.getInfo() failed, fallback to APP_VERSION:', e);
    }
  }
  return APP_VERSION.replace(/^v/i, '').trim();
}

/**
 * Compare two semantic version strings (e.g. "3.0.8" vs "3.1.3", "3.1.2" vs "3.1.3", "3.1.3" vs "3.1.4", "4.0.0" vs "3.9.9")
 * Strips optional leading 'v' or 'V'.
 * Returns:
 *   -1 if v1 < v2 (v2 is newer)
 *    0 if v1 === v2
 *    1 if v1 > v2 (v1 is newer)
 */
export function compareSemVer(v1: string, v2: string): number {
  const clean1 = (v1 || '').replace(/^v/i, '').trim();
  const clean2 = (v2 || '').replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] !== undefined ? parts1[i] : 0;
    const p2 = parts2[i] !== undefined ? parts2[i] : 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

/**
 * Check if a new version is available relative to installed app version
 */
export async function isNewerVersionAvailable(latestVersion: string): Promise<boolean> {
  const currentVersion = await getInstalledAppVersion();
  return compareSemVer(currentVersion, latestVersion) < 0;
}

/**
 * Constructs candidate remote app-version.json URLs.
 * On Native Capacitor Android apps or localhost, ALWAYS hit the canonical production server URL first so old APKs discover new web releases!
 */
export function getAppVersionManifestUrls(): string[] {
  const timestamp = Date.now();
  const urls: string[] = [];

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (Capacitor.isNativePlatform() || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      // Native Android APK / local dev -> Must query remote production website over the internet!
      urls.push(`${PRODUCTION_SITE_URL}/app-version.json?t=${timestamp}`);
      urls.push(`/app-version.json?t=${timestamp}`);
    } else {
      // Web production domain
      urls.push(`/app-version.json?t=${timestamp}`);
      urls.push(`${PRODUCTION_SITE_URL}/app-version.json?t=${timestamp}`);
    }
  } else {
    urls.push(`${PRODUCTION_SITE_URL}/app-version.json?t=${timestamp}`);
  }

  return urls;
}

/**
 * Fetch public application version manifest (/app-version.json) with cache busting
 * from the remote production server and evaluate against the dynamically detected installed version.
 */
export async function checkForAppUpdate(_forceFresh = false): Promise<UpdateCheckResult> {
  const currentVersion = await getInstalledAppVersion();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      status: 'offline',
      currentVersion,
      message: 'Connect to the internet to check for the latest version.',
    };
  }

  const manifestUrls = getAppVersionManifestUrls();
  let manifest: AppVersionManifest | null = null;
  let fetchErrorMsg = '';

  for (const url of manifestUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && typeof json === 'object' && json.version) {
          manifest = json;
          break;
        }
      } else {
        fetchErrorMsg = `HTTP ${res.status}`;
      }
    } catch (err: any) {
      fetchErrorMsg = err?.message || String(err);
      console.warn(`[UpdateCheck] Failed fetching from ${url}:`, err);
    }
  }

  if (!manifest) {
    return {
      status: 'error',
      currentVersion,
      message: `Unable to check for updates (${fetchErrorMsg || 'network error'}).`,
    };
  }

  const latestVersion = String(manifest.version).replace(/^v/i, '').trim();

  // Cache latest fetched manifest in localStorage
  try {
    localStorage.setItem(CACHED_MANIFEST_KEY, JSON.stringify(manifest));
  } catch {
    // ignore
  }

  // Semantic comparison: installed (currentVersion) vs remote (latestVersion)
  const cmp = compareSemVer(currentVersion, latestVersion);

  if (cmp < 0) {
    console.log(`[UpdateCheck] Installed: ${currentVersion} | Remote Latest: ${latestVersion} | Status: update_available`);
    return {
      status: 'update_available',
      currentVersion,
      latestVersion,
      manifest,
    };
  } else {
    console.log(`[UpdateCheck] Installed: ${currentVersion} | Remote Latest: ${latestVersion} | Status: up_to_date`);
    return {
      status: 'up_to_date',
      currentVersion,
      latestVersion,
      manifest,
    };
  }
}

/**
 * Fetch latest app version manifest directly (Helper)
 */
export async function fetchLatestAppVersion(): Promise<AppVersionManifest | null> {
  const res = await checkForAppUpdate();
  if (res.status === 'update_available' || res.status === 'up_to_date') {
    return res.manifest;
  }
  return getCachedVersionManifest();
}

/**
 * Retrieve cached manifest from localStorage
 */
export function getCachedVersionManifest(): AppVersionManifest | null {
  try {
    const raw = localStorage.getItem(CACHED_MANIFEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Check if the user has dismissed/postponed notification for a specific latest version
 */
export function isVersionDismissed(latestVersion: string): boolean {
  // 1. Version-specific dismissal check
  const dismissedKey = `spendly_update_dismissed_${latestVersion}`;
  if (localStorage.getItem(dismissedKey) === 'true') {
    return true;
  }

  // 2. Postponed delay expiry check
  const postponedUntil = localStorage.getItem(POSTPONED_UNTIL_KEY);
  if (postponedUntil) {
    const expiry = parseInt(postponedUntil, 10);
    if (!isNaN(expiry) && Date.now() < expiry) {
      return true;
    }
  }

  return false;
}

/**
 * Postpone / dismiss update notification for specified version (default 7 days)
 */
export function dismissUpdateForVersion(version: string, days = 7): void {
  const dismissedKey = `spendly_update_dismissed_${version}`;
  localStorage.setItem(dismissedKey, 'true');

  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(POSTPONED_UNTIL_KEY, String(expiry));
}

export function postponeUpdateNotification(days = 7): void {
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(POSTPONED_UNTIL_KEY, String(expiry));
}
