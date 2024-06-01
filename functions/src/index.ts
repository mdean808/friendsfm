import serviceAccount from './firebase-auth';
import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { getFirestore } from 'firebase-admin/firestore';

// Init Firebase Credentials
initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  databaseURL: 'https://friendsfm-default-rtdb.firebaseio.com',
});

getFirestore().settings({ ignoreUndefinedProperties: true });

// Init Sentry in Production
if (process.env.FUNCTIONS_EMULATOR !== 'true') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [new ProfilingIntegration()],
    tracesSampleRate: 0.05,
    profilesSampleRate: 0.05,
    release: process.env.COMMIT,
  });
}

export * from './endpoints';
export * from './events';
