import type { AppVersionManifest } from '../types/finance';

export const CURRENT_APP_VERSION = '3.1.1';
export const CURRENT_RELEASE_DATE = '15 September 2026';

const LAST_NOTIFIED_KEY = 'spendly_last_notified_version';
const POSTPONED_UNTIL_KEY = 'spendly_update_postponed_until';
const CACHED_MANIFEST_KEY = 'spendly_cached_version_manifest';

/**
 * Compare two semantic version strings (e.g. "3.1.0" vs "3.0.8", "3.10.0" vs "3.9.0")
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

let inMemoryManifestCache: { data: AppVersionManifest; timestamp: number } | null = null;
const FETCH_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch the public latest application version manifest (/app-version.json)
 */
export async function fetchLatestAppVersion(): Promise<AppVersionManifest | null> {
  // If cached in memory within 5 minutes, return memory cache immediately
  if (inMemoryManifestCache && Date.now() - inMemoryManifestCache.timestamp < FETCH_THROTTLE_MS) {
    return inMemoryManifestCache.data;
  }

  // If offline, attempt to load cached manifest
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return getCachedVersionManifest();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`/app-version.json?t=${Date.now()}`, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return getCachedVersionManifest();
    }

    const data: AppVersionManifest = await res.json();
    if (data && data.version) {
      // Cache latest fetched manifest
      inMemoryManifestCache = { data, timestamp: Date.now() };
      localStorage.setItem(CACHED_MANIFEST_KEY, JSON.stringify(data));
      return data;
    }
    return getCachedVersionManifest();
  } catch (err) {
    console.warn('[Spendly Update Check] Network fetch skipped/failed:', err);
    return getCachedVersionManifest();
  }
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
 * Check whether duplicate notification should be suppressed or postponed
 */
export function shouldShowUpdateNotification(latestVersion: string): boolean {
  if (!isNewerVersionAvailable(latestVersion)) {
    return false;
  }

  // 1. Check if user already saw notification for this exact version
  const lastNotified = localStorage.getItem(LAST_NOTIFIED_KEY);
  if (lastNotified && compareSemVer(lastNotified, latestVersion) >= 0) {
    return false;
  }

  // 2. Check if user clicked "Later" (postponed)
  const postponedUntil = localStorage.getItem(POSTPONED_UNTIL_KEY);
  if (postponedUntil) {
    const expiry = parseInt(postponedUntil, 10);
    if (!isNaN(expiry) && Date.now() < expiry) {
      return false; // Still within postponed delay
    }
  }

  return true;
}

/**
 * Mark version as notified
 */
export function markVersionNotified(version: string): void {
  localStorage.setItem(LAST_NOTIFIED_KEY, version);
  localStorage.removeItem(POSTPONED_UNTIL_KEY);
}

/**
 * Postpone update notification for specified number of days (default 7 days)
 */
export function postponeUpdateNotification(days = 7): void {
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(POSTPONED_UNTIL_KEY, String(expiry));
}
