import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const unlinkmusicplatform = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('unlink-music-platform', async (_req, res, user) => {
      user.dbRef.update({ musicPlatform: '' });
      user.dbRef.update({ musicPlatformAuth: {} });
      res.status(200).json({ type: 'success', message: '' });
    })
  )
);
