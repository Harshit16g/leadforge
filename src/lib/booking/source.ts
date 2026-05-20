export const BOOKING_SOURCE = ["walkin", "online", "qr", "instagram", "phone"] as const;
export type BookingSource = (typeof BOOKING_SOURCE)[number];

export function isOnline(source: string): boolean {
  return source !== "walkin" && source !== "phone";
}
