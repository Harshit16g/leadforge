/**
 * Leaex V2 — Shared Formatting Utilities
 * Single source of truth for display helpers used across partner + admin portals.
 */

/** Returns 1–2 letter initials from a display name. */
export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Formats a number as ₹ Indian locale currency (e.g. ₹1,23,456). */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Shortens large currency values (e.g. ₹1.2L, ₹3.4K). */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000)   return `₹${(amount / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
}

/** Formats an ISO date string as a human-readable date (e.g. 11 Apr 2026). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Formats an ISO datetime string as date + time (e.g. 11 Apr 2026, 3:45 PM). */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formats a time string or ISO date to 12-hour format (e.g. 3:45 PM). */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
