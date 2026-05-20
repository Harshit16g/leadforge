import * as Sentry from "@sentry/nextjs";

// Only initialise Sentry in production / CI.
// Importing the module is fine; calling init() is what causes memory overhead
// (Session Replay, source-map upload, network traffic).
if (process.env.NODE_ENV !== "development") {
  Sentry.init({
    dsn: "https://d78ed1c9100494eeaf99d7bc7d9cf781@o4511180909969408.ingest.de.sentry.io/4511180911804496",
    integrations: [Sentry.replayIntegration()],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: true,
  });
}

// Must always be a function — without init() it is a safe no-op in dev.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
