import { getNearbySubmissions } from '@/lib/location';
import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const nearbysubmissions = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('nearby-submissions', async (req, res) => {
      if (!req.body) res.status(400).end();
      try {
        const data = JSON.parse(req.body);
        if (!data) {
          res.status(400).end();
          return;
        }
        const nearbySubs = await getNearbySubmissions(data.location, 20);
        // sanitize so only user.username, user.id, user.musicplaform, and song and audial data is sent
        const sanitizedSubs = nearbySubs.map((s) => {
          return {
            song: s.song,
            user: s.user,
            audial: s.audial,
            location: s.location,
          };
        });
        res.status(200).json({ type: 'success', message: sanitizedSubs });
      } catch (e) {
        console.log(e);
        res.status(500).end();
      }
    })
  )
);
