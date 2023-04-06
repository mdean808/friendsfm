import * as functions from 'firebase-functions';
import { createSpotifyPlaylist } from '../lib/spotify';
import { SavedSong } from '../types';
import { authMiddleware } from './middleware';

export const getSongs = functions.https.onRequest(
  authMiddleware(async (_req, res, user) => {
    try {
      const songs = await user.getSongs();
      res.status(200).type('json').send({ type: 'success', message: songs });
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
);

export const saveSong = functions.https.onRequest(
  authMiddleware(async (req, res, user) => {
    try {
      const { song }: { song: SavedSong } = JSON.parse(req.body);
      const likedSong = await user.saveSong(song);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: likedSong });
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
);

export const deleteSong = functions.https.onRequest(
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
);

export const createLikedSongsPlaylist = functions.https.onRequest(
  authMiddleware(async (_req, res, user) => {
    try {
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
    } catch (e) {
      functions.logger.info('Error in createLikedSongsPlaylist.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);
