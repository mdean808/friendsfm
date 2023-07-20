import serviceAccount from '../firebase-auth';
import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import * as Sentry from '@sentry/node';

// Init Firebase Credentials
initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  databaseURL: 'https://friendsfm-default-rtdb.firebaseio.com',
});

// Init Sentry in Production
if (process.env.FUNCTIONS_EMULATOR !== 'true') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 0.5,
  });
}

export * from './endpoints/auth';
export * from './endpoints/friends';
export * from './endpoints/notifications';
export * from './endpoints/submissions';
export * from './endpoints/users';
export * from './endpoints/songs';
