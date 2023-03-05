import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import { addSong, getUserSongs, removeSong } from '../lib/db';
import { Song } from '../types';

const auth = getAuth();

export const getSongs = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { authToken }: { song: Song; authToken: string } = JSON.parse(req.body);
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
  const { song, authToken }: { song: Song; authToken: string } = JSON.parse(
    req.body
  );
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
  const { song, authToken }: { song: Song; authToken: string } = JSON.parse(
    req.body
  );
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
