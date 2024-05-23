import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';
import { SpotifyServerApi } from '@/classes/SpotifyServerApi';

export const searchspotify = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('search-spotify', async (req, res) => {
      const data = JSON.parse(req.body);
      const spotifyApi = new SpotifyServerApi(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET
      );
      const results = await spotifyApi.search(data.query, data.types);
      res.status(200).type('json').send({ type: 'success', message: results });
    })
  )
);
