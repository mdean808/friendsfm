import { SavedSong } from '@/types';
import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';
import Submission from '@/classes/submission';

export const deletesong = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('delete-song', async (req, res, user) => {
      const { song, subId }: { song: SavedSong; subId: string } = JSON.parse(
        req.body
      );
      await user.unsaveSong(song);

      if (subId) {
        const submission = new Submission(subId);
        await submission.load();
        await submission.decrementLikes();
      }
      res.status(200).type('json').send({ type: 'success', message: '' });
    })
  )
);
