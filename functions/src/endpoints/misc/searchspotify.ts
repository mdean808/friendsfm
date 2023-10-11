import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';
import { searchSpotify } from '@/lib/spotify';

export const searchspotify = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('search-spotify', async (req, res, user) => {
      await user.updateMusicAuth();
      const data = JSON.parse(req.body);
      const results = await searchSpotify(
        data.query,
        data.types,
        user.musicPlatformAuth
      );
      res.status(200).type('json').send({ type: 'success', message: results });
    })
  )
);
