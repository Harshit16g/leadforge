import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserClient | undefined;

/**
 * Single browser Supabase client per tab.
 * Calling `createBrowserClient` on every render produces new `auth` instances and
 * breaks effects that list `supabase.auth` in dependency arrays (infinite refetch).
 */
export function createClient(): BrowserClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
    );
  }
  return browserClient;
}
