import * as functions from 'firebase-functions';
import { createSpotifyPlaylist } from '../lib/spotify';
import { SavedSong } from '../types';
import { authMiddleware, sentryWrapper } from './middleware';

export const getSongs = functions.https.onRequest(
  sentryWrapper(
    'get-songs',

    authMiddleware(async (_req, res, user) => {
      const songs = await user.getSongs();
      res.status(200).type('json').send({ type: 'success', message: songs });
    })
  )
);

export const saveSong = functions.https.onRequest(
  sentryWrapper(
    'save-song',

    authMiddleware(async (req, res, user) => {
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
  sentryWrapper(
    'delete-song',

    authMiddleware(async (req, res, user) => {
      const { song }: { song: SavedSong } = JSON.parse(req.body);
      user.unsaveSong(song);
      res.status(200).type('json').send({ type: 'success', message: '' });
    })
  )
);

export const createLikedSongsPlaylist = functions.https.onRequest(
  sentryWrapper(
    'create-liked-songs-playlist',

    authMiddleware(async (_req, res, user) => {
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
