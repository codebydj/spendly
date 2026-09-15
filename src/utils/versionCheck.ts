import type { AppVersionManifest } from '../types/finance';
import { APP_VERSION, APP_BUILD_DATE } from '../config/appVersion';

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
 * Compare two semantic version strings (e.g. "3.1.2" vs "3.1.3", "4.0.0" vs "3.9.9")
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
 * Check if a new version is available relative to CURRENT_APP_VERSION
 */
export function isNewerVersionAvailable(latestVersion: string): boolean {
  return compareSemVer(CURRENT_APP_VERSION, latestVersion) < 0;
}

/**
 * Fetch public application version manifest (/app-version.json) with cache prevention
 * and evaluate against CURRENT_APP_VERSION.
 */
export async function checkForAppUpdate(_forceFresh = false): Promise<UpdateCheckResult> {
  const currentVersion = CURRENT_APP_VERSION;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      status: 'offline',
      currentVersion,
      message: 'Connect to the internet to check for the latest version.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`/app-version.json?t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        status: 'error',
        currentVersion,
        message: `Unable to check for updates (HTTP ${res.status}).`,
      };
    }

    const manifest: AppVersionManifest = await res.json();
    if (!manifest || typeof manifest !== 'object' || !manifest.version) {
      return {
        status: 'error',
        currentVersion,
        message: 'Invalid version manifest format received.',
      };
    }

    const latestVersion = String(manifest.version).trim();

    // Cache latest fetched manifest in localStorage
    localStorage.setItem(CACHED_MANIFEST_KEY, JSON.stringify(manifest));

    // Semantic comparison
    const cmp = compareSemVer(currentVersion, latestVersion);

    if (cmp < 0) {
      console.log(`[UpdateCheck] Current: ${currentVersion} | Latest: ${latestVersion} | Status: update_available`);
      return {
        status: 'update_available',
        currentVersion,
        latestVersion,
        manifest,
      };
    } else {
      console.log(`[UpdateCheck] Current: ${currentVersion} | Latest: ${latestVersion} | Status: up_to_date`);
      return {
        status: 'up_to_date',
        currentVersion,
        latestVersion,
        manifest,
      };
    }
  } catch (err: any) {
    console.warn('[UpdateCheck] Fetch error:', err);
    return {
      status: 'error',
      currentVersion,
      message: 'Unable to check for updates. Please try again later.',
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
