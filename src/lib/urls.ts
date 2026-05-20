/**
 * Unified URL Utility
 * Ensures consistent base URL across the platform based on environment.
 */

export const getBaseUrl = () => {
  // Check if we are in a browser environment
  if (typeof window !== 'undefined') return window.location.origin;

  const vEnv = process.env.VERCEL_ENV;

  if (vEnv === 'production') return 'https://app.leaex.com';

  if (vEnv === 'preview' && process.env.VERCEL_URL) {
    return `https://leaex.vercel.app`;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Fallback to Public App URL env var, or production default
  return process.env.NEXT_PUBLIC_APP_URL || 'https://leaex.com';
};

/**
 * Common system domains and emails
 */
export const SYSTEM_EMAILS = {
  SUPPORT: 'Help@support.leaex.com',
  ONBOARDING: 'onboarding@leaex.com',
  BOOKINGS: 'bookings@support.leaex.com',
};

export const SYSTEM_DOMAINS = {
  PRODUCTION: 'leaex.com',
  HUB: 'leaex.com',
};
