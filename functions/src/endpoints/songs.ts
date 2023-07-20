import * as functions from 'firebase-functions';
import { createSpotifyPlaylist } from '../lib/spotify';
import { SavedSong } from '../types';
import { authMiddleware, sentryWrapper } from './middleware';

export const getSongs = sentryWrapper(
  'get-songs',
  functions.https.onRequest(
    authMiddleware(async (_req, res, user) => {
      const songs = await user.getSongs();
      res.status(200).type('json').send({ type: 'success', message: songs });
    })
  )
);

export const saveSong = sentryWrapper(
  'save-song',
  functions.https.onRequest(
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

export const deleteSong = sentryWrapper(
  'delete-song',
  functions.https.onRequest(
    authMiddleware(async (req, res, user) => {
      try {
        const { song }: { song: SavedSong } = JSON.parse(req.body);
        user.unsaveSong(song);
        res.status(200).type('json').send({ type: 'success', message: '' });
      } catch (e) {
        functions.logger.info('Error in saveSong.');
        functions.logger.error(e);
        res.status(400).json({
          type: 'error',
          message: 'Something went wrong. Please try again.',
          error: (e as Error).message,
        });
      }
    })
  )
);

export const createLikedSongsPlaylist = sentryWrapper(
  'create-liked-songs-playlist',
  functions.https.onRequest(
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
