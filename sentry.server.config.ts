import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Performance monitoring
  beforeSend(event, hint) {
    // Filter out noisy errors
    if (event.exception) {
      const error = hint.originalException;

      // Filter out expected errors
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;

        // Filter out database connection timeouts during deployment
        if (
          message.includes('timeout') ||
          message.includes('ECONNRESET') ||
          message.includes('Connection terminated')
        ) {
          return null;
        }
      }
    }

    return event;
  },

  // Set server context
  beforeSendTransaction(event) {
    // Don't send health check transactions
    if (event.transaction === 'GET /api/health') {
      return null;
    }
    return event;
  },

  // Additional server-side configuration
  debug: process.env.NODE_ENV === 'development',

  // Capture unhandled promise rejections
  captureUnhandledRejections: true,
});
