import * as functions from 'firebase-functions';
import { authMiddleware } from './middleware';

export const getUser = functions.https.onRequest(
  authMiddleware(async (req, res, user) => {
    try {
      const { messagingToken }: { messagingToken?: string } = JSON.parse(
        req.body
      );
      if (messagingToken) {
        await user.setMessagingToken(messagingToken);
      }
      const songs = await user.getSongs();
      res
        .status(200)
        .type('json')
        .send({
          type: 'success',
          message: { user: user.json, songs: songs },
        });
    } catch (e) {
      functions.logger.info('Error in setMessagingToken.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);

export const setUsername = functions.https.onRequest(
  authMiddleware(async (req, res, user) => {
    try {
      const { username } = JSON.parse(req.body);
      await user.setUsername(username);
      res.status(200).type('json').send({ type: 'success', message: username });
    } catch (e) {
      functions.logger.info('Error in setUserUsername.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);

export const setMusicPlatform = functions.https.onRequest(
  authMiddleware(async (req, res, user) => {
    try {
      const { musicPlatform, platformAuthCode } = JSON.parse(req.body);
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
  })
);

export const unlinkMusicPlatform = functions.https.onRequest(
  authMiddleware(async (_req, res, user) => {
    try {
      await user.dbRef.update({ musicPlatform: '' });
      await user.dbRef.update({ musicPlatformAuth: {} });
      res.status(200).json({ type: 'success', message: '' });
    } catch (e) {
      functions.logger.info('Error in unlinkMusicPlatform.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);
