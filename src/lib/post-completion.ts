/**
 * Post-completion actions fired after any session (booking or walk-in) is marked complete.
 * All messages go through the partner's own WhatsApp instance — no SMS/MSG91.
 * Fire-and-forget: never throws, never blocks the HTTP response.
 */

export async function firePostCompletion(bookingId: string): Promise<void> {
  // WhatsApp notifications completely disabled.
  console.log("[post-completion] WhatsApp notifications completely disabled for:", bookingId);
}
