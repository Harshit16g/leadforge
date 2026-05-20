import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d78ed1c9100494eeaf99d7bc7d9cf781@o4511180909969408.ingest.de.sentry.io/4511180911804496",
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
});
