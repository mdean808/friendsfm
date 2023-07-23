import { SavedSong } from '@/types';
import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const deletesong = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('delete-song', async (req, res, user) => {
      const { song }: { song: SavedSong } = JSON.parse(req.body);
      user.unsaveSong(song);
      res.status(200).type('json').send({ type: 'success', message: '' });
    })
  )
);
