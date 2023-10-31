import { createSpotifyPlaylist } from '@/lib/spotify';
import { Song } from '@/types';
import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const createsubmissionsplaylist = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('create-submissions-playlist', async (_req, res, user) => {
      const songs: Song[] = [];
      const song = (await user.getSubmission())?.song || null;
      if (song) songs.push(song);
      const friendSubmissions = await user.getFriendSubmissions();
      for (const sub of friendSubmissions) {
        songs.push(sub.song);
      }
      await user.updateSpotifyAuth();
      const playlistUrl = await createSpotifyPlaylist(
        user.musicPlatformAuth,
        songs,
        'friendsfm - submissions',
        "rotating playlist of your friend's friendsfm submissions",
        true
      );
      await user.dbRef.update({ submissionsPlaylist: playlistUrl });
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: playlistUrl });
    })
  )
);
