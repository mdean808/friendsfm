import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const setsongsplaylist = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('set-songs-playlist', async (req, res, user) => {
      const { playlist } = JSON.parse(req.body);
      user.likedSongsPlaylist = playlist;
      user.dbRef.update({ likedSongsPlaylist: playlist });
      res.status(200).type('json').send({ type: 'success', message: playlist });
    })
  )
);
