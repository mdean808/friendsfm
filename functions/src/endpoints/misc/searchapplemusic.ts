import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';
import { searchAppleMusic } from '@/lib/music-kit';

export const searchapplemusic = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('search-apple-music', async (req, res) => {
      const data = JSON.parse(req.body);
      const results = await searchAppleMusic(data.query, data.types);
      res.status(200).type('json').send({ type: 'success', message: results });
    })
  )
);
