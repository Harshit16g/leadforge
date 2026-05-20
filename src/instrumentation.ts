import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Skip Sentry initialisation in local dev — too memory-heavy.
  // register() returning early prevents the server/edge configs from running,
  // so no Sentry SDK is initialised and no data is ever sent.
  if (process.env.NODE_ENV === "development") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// onRequestError must always be a function (never undefined).
// Without init() having been called it is a safe no-op in dev.
export const onRequestError = Sentry.captureRequestError;
