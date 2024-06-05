import { handleErrorWithSentry } from '@sentry/sveltekit';
import * as Sentry from '@sentry/capacitor';
import * as SentrySvelteKit from '@sentry/sveltekit';
import { dev } from '$app/environment';

Sentry.init(
  {
    dsn: 'https://50588339e52f9a127d6fe031e143ba5f@o4504839408844801.ingest.us.sentry.io/4504839411400704',

    // Set your dist version, such as "1"
    dist: '1',
    release: COMMIT,
    environment: !dev && RELEASE ? 'production' : 'development',
    integrations: [
      // Registers and configures the Tracing integration,
      // which automatically instruments your application to monitor its
      // performance, including custom Angular routing instrumentation
      SentrySvelteKit.browserTracingIntegration(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.25,

    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/[a-zA-Z0-9-]+\-tprlxlzyxq-uc\.a\.run\.app/,
    ],
  },
  // Forward the init method from @sentry/angular
  SentrySvelteKit.init
);

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
