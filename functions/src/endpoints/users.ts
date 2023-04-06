import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import {
  getUserById,
  getUserSongs,
  setUserMusicPlatform,
  setUserUsername,
  updateUserMessagingToken,
} from '../lib/db';

const auth = getAuth();
const db = getFirestore();

export const getUser = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const {
    messagingToken,
    authToken,
  }: { messagingToken?: string; authToken: string } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const userRes = await getUserById(id);
    if (!userRes) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      if (messagingToken) updateUserMessagingToken(id, messagingToken);
      const songs = await getUserSongs(id);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: { user: userRes, songs: songs } });
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

export const setUsername = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { username, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const userRes = await getUserById(id);
    if (!userRes) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await setUserUsername(id, username);
        res
          .status(200)
          .type('json')
          .send({ type: 'success', message: username });
      } catch (e) {
        functions.logger.info('Error in setUserUsername.');
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

export const setMusicPlatform = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { musicPlatform, platformAuthCode, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const userRes = await getUserById(id);
    if (!userRes) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await setUserMusicPlatform(id, musicPlatform, platformAuthCode);
        res.status(200).json({ type: 'success', message: musicPlatform });
      } catch (e) {
        functions.logger.info('Error in setMusicPlatform.');
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

export const unlinkMusicPlatform = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { authToken } = JSON.parse(req.body);
    try {
      const id = (await auth.verifyIdToken(authToken)).uid;
      const userRes = await getUserById(id);
      if (!userRes) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        try {
          const userRef = db.collection('users').doc(id);
          await userRef.update({ musicPlatform: '' });
          await userRef.update({ musicPlatformAuth: {} });
          res.status(200).json({ type: 'success', message: '' });
        } catch (e) {
          functions.logger.info('Error in setMusicPlatform.');
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
