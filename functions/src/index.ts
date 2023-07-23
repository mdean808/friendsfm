import serviceAccount from './firebase-auth';
import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Init Firebase Credentials
initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  databaseURL: 'https://friendsfm-default-rtdb.firebaseio.com',
});

// Init Sentry in Production
if (process.env.FUNCTIONS_EMULATOR !== 'true') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [new ProfilingIntegration()],
    tracesSampleRate: 0.5,
    profilesSampleRate: 0.5,
    release: process.env.COMMIT,
  });
}

export * from './endpoints';
