import * as functions from 'firebase-functions';
import { createSpotifyPlaylist } from '../lib/spotify';
import { SavedSong } from '../types';
import { authMiddleware, sentryWrapper } from './middleware';

export const getSongs = functions.https.onRequest(
  authMiddleware(
    sentryWrapper('get-songs', async (_req, res, user) => {
      const songs = await user.getSongs();
      res.status(200).type('json').send({ type: 'success', message: songs });
    })
  )
);

export const saveSong = functions.https.onRequest(
  authMiddleware(
    sentryWrapper('save-song', async (req, res, user) => {
      const { song }: { song: SavedSong } = JSON.parse(req.body);
      const likedSong = await user.saveSong(song);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: likedSong });
    })
  )
);

export const deleteSong = functions.https.onRequest(
  authMiddleware(
    sentryWrapper('delete-song', async (req, res, user) => {
      const { song }: { song: SavedSong } = JSON.parse(req.body);
      user.unsaveSong(song);
      res.status(200).type('json').send({ type: 'success', message: '' });
    })
  )
);

export const createLikedSongsPlaylist = functions.https.onRequest(
  authMiddleware(
    sentryWrapper('create-liked-songs-playlist', async (_req, res, user) => {
      await user.updateMusicAuth();
      const songs = await user.getSongs();
      const playlistUrl = await createSpotifyPlaylist(
        user.musicPlatformAuth,
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
