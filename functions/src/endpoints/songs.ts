import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import User from '../classes/user';
import { createSpotifyPlaylist } from '../lib/spotify';
import { SavedSong } from '../types';

const auth = getAuth();

export const getSongs = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { authToken }: { authToken: string } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const user = new User(id);
    await user.load();
    if (!user.exists) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        const songs = await user.getSongs();
        res.status(200).type('json').send({ type: 'success', message: songs });
      } catch (e) {
        functions.logger.info('Error in saveSong.');
        functions.logger.error(e);
        res.status(400).json({ type: 'error', message: (e as Error).message });
      }
    }
  } catch (e) {
    // firebase authnetication error
    functions.logger.error(e);
    res.status(401).json({
      type: 'error',
      message: 'Authentication Failed.',
      error: (e as Error).message,
    });
  }
});

export const saveSong = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { song, authToken }: { song: SavedSong; authToken: string } =
    JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const user = new User(id);
    await user.load();
    if (!user.exists) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        const likedSong = await user.saveSong(song);
        res
          .status(200)
          .type('json')
          .send({ type: 'success', message: likedSong });
      } catch (e) {
        functions.logger.info('Error in saveSong.');
        functions.logger.error(e);
        res.status(400).json({ type: 'error', message: (e as Error).message });
      }
    }
  } catch (e) {
    // firebase authnetication error
    functions.logger.error(e);
    res.status(401).json({
      type: 'error',
      message: 'Authentication Failed.',
      error: (e as Error).message,
    });
  }
});

export const deleteSong = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { song, authToken }: { song: SavedSong; authToken: string } =
    JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const user = new User(id);
    await user.load();
    if (!user.exists) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        user.unsaveSong(song);
        res.status(200).type('json').send({ type: 'success', message: '' });
      } catch (e) {
        functions.logger.info('Error in saveSong.');
        functions.logger.error(e);
        res.status(400).json({ type: 'error', message: (e as Error).message });
      }
    }
  } catch (e) {
    // firebase authnetication error
    functions.logger.error(e);
    res.status(401).json({
      type: 'error',
      message: 'Authentication Failed.',
      error: (e as Error).message,
    });
  }
});

export const createLikedSongsPlaylist = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { authToken }: { authToken: string } = JSON.parse(req.body);
    try {
      const id = (await auth.verifyIdToken(authToken)).uid;
      const user = new User(id);
      await user.load();
      if (!user.exists) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
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
          res
            .status(400)
            .json({ type: 'error', message: (e as Error).message });
        }
      }
    } catch (e) {
      // firebase authnetication error
      functions.logger.error(e);
      res.status(401).json({
        type: 'error',
        message: 'Authentication Failed.',
        error: (e as Error).message,
      });
    }
  }
);
