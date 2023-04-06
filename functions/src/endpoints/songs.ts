import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { addSong, getUserSongs, removeSong } from '../lib/db';
import { checkSpotifyAccessCode, createSpotifyPlaylist } from '../lib/spotify';
import { MusicPlatformAuth, SavedSong } from '../types';

const auth = getAuth();
const db = getFirestore();

export const getSongs = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { authToken }: { authToken: string } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    if (!id) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        const songs = await getUserSongs(id);
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
    if (!id) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        const likedSong = await addSong(id, song);
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
    if (!id) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await removeSong(id, song);
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
      if (!id) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        try {
          const userRef = db.collection('users').doc(id);
          const user = await userRef.get();
          const musicPlatformAuth = user.get(
            'musicPlatformAuth'
          ) as MusicPlatformAuth;
          const accessCode = await checkSpotifyAccessCode(
            musicPlatformAuth,
            userRef
          );
          const songs = await getUserSongs(id);
          musicPlatformAuth.access_token = accessCode;
          const playlistUrl = await createSpotifyPlaylist(
            musicPlatformAuth,
            songs,
            'friendsfm - saved songs',
            'all your saved friendsfm songs',
            true
          );
          userRef.update({ likedSongsPlaylist: playlistUrl });
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
