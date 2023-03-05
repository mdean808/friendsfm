import serviceAccount from '../firebase-auth';
import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  databaseURL: 'https://friendsfm-default-rtdb.firebaseio.com',
});

export * from './endpoints/auth';
export * from './endpoints/friends';
export * from './endpoints/notifications';
export * from './endpoints/submissions';
export * from './endpoints/users';
export * from './endpoints/songs';
