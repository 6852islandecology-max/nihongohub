// [server] Vercel Serverless Functions から import される。ブラウザからは読み込まれない。
// lib/sentry.js
// Sentry initialization for NihongoHub serverless functions (Node.js platform).
// Spec: specs/PhaseB-plus-monitoring-spec.md §2.2

import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry() {
  if (initialized || !process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || "development",
    tracesSampleRate: 0.1,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers["x-admin-key"];
      }
      return event;
    },
  });
  initialized = true;
}

export function isSentryConfigured() {
  return !!process.env.SENTRY_DSN;
}

export function captureApiError(err, context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.error("Sentry not configured, error logged locally:", err, context);
    return;
  }
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setContext(k, v));
    Sentry.captureException(err);
  });
}

export function captureMessage(msg, level = "info", context = {}) {
  if (!process.env.SENTRY_DSN) return;
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setContext(k, v));
    Sentry.captureMessage(msg, level);
  });
}
