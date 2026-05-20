/**
 * Utility to generate the base URL for the application.
 * Canonical implementation in @/lib/urls. This is a thin wrapper
 * that re-exports for convenience while keeping local usage working.
 */
import { getBaseUrl as canonicalGetBaseUrl } from "@/lib/urls";

/** @see {@link canonicalGetBaseUrl} */
export function getBaseUrl(): string {
  return canonicalGetBaseUrl();
}

/**
 * Generates the redirect URL for Supabase OAuth.
 * Includes the /auth/callback path and an optional 'next' parameter.
 * 
 * @param nextPath The path to return to after successful auth (e.g. '/book/my-salon')
 * @returns A fully qualified URL (e.g. 'http://localhost:3000/auth/callback?next=%2Fbook%2Fmy-salon')
 */
export function getOAuthRedirectUrl(nextPath?: string) {
  const baseUrl = getBaseUrl();
  const callbackUrl = `${baseUrl}/auth/callback`;
  
  if (nextPath) {
    return `${callbackUrl}?next=${encodeURIComponent(nextPath)}`;
  }
  
  return callbackUrl;
}
