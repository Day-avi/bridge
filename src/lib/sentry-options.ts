import type { BrowserOptions } from "@sentry/nextjs";

// Shared by the browser, server and edge Sentry setups. No DSN (local dev, CI)
// means Sentry stays off.
export const sentryOptions: BrowserOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  tracesSampleRate: 0.1,
  // Send the error and stack trace only. Forms carry passwords, cookies carry
  // sessions, and later pages show buyers' comments, so none of that leaves.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  },
};
