import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import User from '../classes/user';

const auth = getAuth();

export const getUser = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const {
    messagingToken,
    authToken,
  }: { messagingToken?: string; authToken: string } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const user = new User(id);
    await user.load();
    if (!user.exists) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      if (messagingToken) {
        await user.setMessagingToken(messagingToken);
      }
      const songs = await user.getSongs();
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: { user: user.json, songs: songs } });
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
    const user = new User(id);
    await user.load();
    if (!user.exists) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await user.setUsername(username);
        res
          .status(200)
          .type('json')
          .send({ type: 'success', message: username });
      } catch (e) {
        functions.logger.info('Error in setUserUsername.');
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

export const setMusicPlatform = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { musicPlatform, platformAuthCode, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const user = new User(id);
    await user.load();
    if (!user.exists) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await user.setMusicPlatform(musicPlatform, platformAuthCode);
        res.status(200).json({ type: 'success', message: musicPlatform });
      } catch (e) {
        functions.logger.info('Error in setMusicPlatform.');
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

export const unlinkMusicPlatform = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { authToken } = JSON.parse(req.body);
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
          await user.dbRef.update({ musicPlatform: '' });
          await user.dbRef.update({ musicPlatformAuth: {} });
          res.status(200).json({ type: 'success', message: '' });
        } catch (e) {
          functions.logger.info('Error in setMusicPlatform.');
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
