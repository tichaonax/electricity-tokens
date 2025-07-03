import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Adjust this value in production for edge functions
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.1,

  // Edge functions have limited runtime, so use minimal configuration
  beforeSend(event) {
    // Filter out edge-specific noisy errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('Edge Runtime')) {
        return null;
      }
    }

    return event;
  },
});
