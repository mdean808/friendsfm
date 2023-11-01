import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '@/endpoints/middleware';

export const logoutuser = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('logout-user', async (_req, res, user) => {
      user.messagingToken = '';
      user.dbRef.update({ messagingToken: '' });
      res.status(200).json({ type: 'success', message: 'success' });
    })
  )
);
