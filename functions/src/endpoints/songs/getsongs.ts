import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const getsongs = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('get-songs', async (_req, res, user) => {
      const songs = await user.getSongs();
      res.status(200).type('json').send({ type: 'success', message: songs });
    })
  )
);
