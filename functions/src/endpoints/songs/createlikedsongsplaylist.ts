import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const createlikedsongsplaylist = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('create-liked-songs-playlist', async (_req, res, user) => {
      await user.updateSpotifyAuth();
      const songs = await user.getSongs();
      const playlistUrl = await user.spotify.createPlaylist(
        songs,
        'friendsfm - saved songs',
        'all your saved friendsfm songs',
        true
      );
      user.dbRef.update({ likedSongsPlaylist: playlistUrl });
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: playlistUrl });
    })
  )
);
