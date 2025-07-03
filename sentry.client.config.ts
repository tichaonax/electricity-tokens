import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture 100% of the transactions for performance monitoring in development
  // Reduce this value in production to avoid hitting rate limits
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture 100% of the transactions for performance monitoring
  // This sets the sample rate to be 10% in production and 100% in development
  replaysOnErrorSampleRate: 1.0,

  // Integration options
  integrations: [
    new Sentry.Replay({
      // Capture 10% of all sessions,
      // plus always capture sessions with an error
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Performance monitoring
  beforeSend(event, hint) {
    // Filter out noisy errors
    if (event.exception) {
      const error = hint.originalException;

      // Filter out network errors and user cancellations
      if (error && typeof error === 'object' && 'name' in error) {
        if (
          error.name === 'ChunkLoadError' ||
          error.name === 'NavigationDuplicated' ||
          error.name === 'AbortError'
        ) {
          return null;
        }
      }
    }

    return event;
  },

  // Set user context
  beforeSendTransaction(event) {
    // Don't send health check transactions
    if (event.transaction === 'GET /api/health') {
      return null;
    }
    return event;
  },
});
