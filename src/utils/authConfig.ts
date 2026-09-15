/**
 * Centralized Authentication Configuration & Canonical Production Domain
 * Production site URL MUST be https://finance-spendly.vercel.app/
 */

export const PRODUCTION_SITE_URL = 'https://finance-spendly.vercel.app';

/**
 * Returns the canonical redirect URL for authentication flows.
 * Uses localhost/127.0.0.1 for local development, and canonical production URL for production & preview builds.
 */
export function getAppSiteUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin;
    }
  }
  return PRODUCTION_SITE_URL;
}

/**
 * Returns the exact update password URL for reset emails:
 * https://finance-spendly.vercel.app/update-password
 */
export function getUpdatePasswordUrl(): string {
  return `${getAppSiteUrl()}/update-password`;
}
