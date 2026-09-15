import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { AppVersionManifest } from '../types/finance';
import { APP_VERSION, APP_BUILD_DATE } from '../config/appVersion';
import { PRODUCTION_SITE_URL } from './authConfig';

export const CURRENT_APP_VERSION = APP_VERSION;
export const CURRENT_RELEASE_DATE = APP_BUILD_DATE;

const CACHED_MANIFEST_KEY = 'spendly_cached_version_manifest';

export type UpdateCheckResult =
  | {
      status: 'update_available';
      currentVersion: string;
      latestVersion: string;
      manifest: AppVersionManifest;
      checkUrl: string;
      httpStatus: number;
      lastCheckedAt: string;
      source: 'REMOTE_PRODUCTION' | 'BUNDLED' | 'UNKNOWN';
    }
  | {
      status: 'up_to_date';
      currentVersion: string;
      latestVersion: string;
      manifest: AppVersionManifest;
      checkUrl: string;
      httpStatus: number;
      lastCheckedAt: string;
      source: 'REMOTE_PRODUCTION' | 'BUNDLED' | 'UNKNOWN';
    }
  | {
      status: 'offline';
      currentVersion: string;
      message: string;
      checkUrl?: string;
      httpStatus?: number;
      latestVersion?: string;
      source?: 'REMOTE_PRODUCTION' | 'BUNDLED' | 'UNKNOWN';
      lastCheckedAt: string;
    }
  | {
      status: 'error';
      currentVersion: string;
      message: string;
      checkUrl?: string;
      httpStatus?: number;
      latestVersion?: string;
      source?: 'REMOTE_PRODUCTION' | 'BUNDLED' | 'UNKNOWN';
      lastCheckedAt: string;
    };

/**
 * Dynamically read the actual installed app version from the device runtime.
 * On Android / native Capacitor runtime: reads versionName from App.getInfo() (e.g. "3.1.2", "3.1.4").
 * On Web: returns the configured APP_VERSION ("3.1.4").
 */
export async function getInstalledAppVersion(): Promise<string> {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  if (isNative) {
    try {
      const info = await App.getInfo();
      if (info && info.version) {
        const ver = info.version.replace(/^v/i, '').trim();
        console.log(`[Spendly Update] Platform: android | Installed: ${ver}`);
        return ver;
      }
    } catch (e) {
      console.warn('[Spendly Update] Native App.getInfo() failed, fallback to APP_VERSION:', e);
    }
  }
  const webVer = APP_VERSION.replace(/^v/i, '').trim();
  console.log(`[Spendly Update] Platform: web | Installed: ${webVer}`);
  return webVer;
}

/**
 * Compare two semantic version strings (e.g. "3.1.2" vs "3.1.4", "3.1.4" vs "3.1.4")
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
 * Fetch public application version manifest (/app-version.json) with cache busting
 * directly from the remote production server (https://finance-spendly.vercel.app/app-version.json)
 * and evaluate against the dynamically detected installed version.
 */
export async function checkForAppUpdate(_forceFresh = false): Promise<UpdateCheckResult> {
  const currentVersion = await getInstalledAppVersion();
  const lastCheckedAt = new Date().toISOString();
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('[Spendly Update] Result: OFFLINE');
    return {
      status: 'offline',
      currentVersion,
      message: 'Connect to the internet to check for the latest version.',
      lastCheckedAt,
    };
  }

  // Canonical production URL with runtime timestamp query parameter
  const targetUrl = `${PRODUCTION_SITE_URL}/app-version.json?t=${Date.now()}`;
  console.log(`[Spendly Update] Remote URL: ${targetUrl}`);

  let manifest: AppVersionManifest | null = null;
  let httpStatus = 0;
  let fetchErrorMsg = '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    httpStatus = res.status;
    console.log(`[Spendly Update] HTTP: ${httpStatus}`);

    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === 'object' && json.version) {
        manifest = json;
      } else {
        fetchErrorMsg = 'Invalid remote version JSON structure';
      }
    } else {
      fetchErrorMsg = `Server returned HTTP ${res.status}`;
    }
  } catch (err: any) {
    fetchErrorMsg = err?.message || 'Network request failed';
    console.warn(`[Spendly Update] Network fetch error from ${targetUrl}:`, err);
  }

  // Fallback for Web browser environment ONLY if production URL failed (e.g. preview deployment)
  if (!manifest && !isNative) {
    try {
      const relativeUrl = `/app-version.json?t=${Date.now()}`;
      console.log(`[Spendly Update] Fallback relative fetch: ${relativeUrl}`);
      const res = await fetch(relativeUrl);
      if (res.ok) {
        manifest = await res.json();
        httpStatus = res.status;
      }
    } catch {
      // ignore
    }
  }

  if (!manifest) {
    console.log(`[Spendly Update] Comparison: ERROR (${fetchErrorMsg})`);
    return {
      status: 'error',
      currentVersion,
      message: `Could not check for updates (${fetchErrorMsg || 'network error'}).`,
      checkUrl: targetUrl,
      httpStatus,
      lastCheckedAt,
    };
  }

  const latestVersion = String(manifest.version).replace(/^v/i, '').trim();
  console.log(`[Spendly Update] Remote: ${latestVersion}`);

  // Cache latest fetched manifest in localStorage
  try {
    localStorage.setItem(CACHED_MANIFEST_KEY, JSON.stringify(manifest));
  } catch {
    // ignore
  }

  // Semantic comparison: installed (currentVersion) vs remote (latestVersion)
  const cmp = compareSemVer(currentVersion, latestVersion);

  if (cmp < 0) {
    console.log(`[Spendly Update] Comparison: UPDATE_AVAILABLE (Installed: ${currentVersion}, Remote: ${latestVersion})`);
    return {
      status: 'update_available',
      currentVersion,
      latestVersion,
      manifest,
      checkUrl: targetUrl,
      httpStatus: httpStatus || 200,
      lastCheckedAt,
      source: 'REMOTE_PRODUCTION',
    };
  } else {
    console.log(`[Spendly Update] Comparison: UP_TO_DATE (Installed: ${currentVersion}, Remote: ${latestVersion})`);
    return {
      status: 'up_to_date',
      currentVersion,
      latestVersion,
      manifest,
      checkUrl: targetUrl,
      httpStatus: httpStatus || 200,
      lastCheckedAt,
      source: 'REMOTE_PRODUCTION',
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
  const cleanVer = (latestVersion || '').replace(/^v/i, '').trim();
  if (!cleanVer) return false;

  // 1. Version-specific dismissal check (e.g. spendly_update_dismissed_3.1.5)
  const dismissedKey = `spendly_update_dismissed_${cleanVer}`;
  if (localStorage.getItem(dismissedKey) === 'true') {
    return true;
  }

  // 2. Version-specific postponed delay expiry check
  const postponedKey = `spendly_update_postponed_${cleanVer}`;
  const postponedUntil = localStorage.getItem(postponedKey);
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
  const cleanVer = (version || '').replace(/^v/i, '').trim();
  if (!cleanVer) return;

  const dismissedKey = `spendly_update_dismissed_${cleanVer}`;
  localStorage.setItem(dismissedKey, 'true');

  const postponedKey = `spendly_update_postponed_${cleanVer}`;
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(postponedKey, String(expiry));
}

export function postponeUpdateNotification(days = 7): void {
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem('spendly_update_postponed_general', String(expiry));
}
