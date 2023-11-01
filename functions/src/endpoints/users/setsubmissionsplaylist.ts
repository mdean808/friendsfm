import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const setsubmissionsplaylist = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('set-submissions-playlist', async (req, res, user) => {
      const { playlist } = JSON.parse(req.body);
      user.submissionsPlaylist = playlist;
      user.dbRef.update({ submissionsPlaylist: playlist });
      res.status(200).type('json').send({ type: 'success', message: playlist });
    })
  )
);
