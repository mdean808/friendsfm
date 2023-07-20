import * as functions from 'firebase-functions';
import { authMiddleware, sentryWrapper } from './middleware';

export const getUser = functions.https.onRequest(
  authMiddleware(
    sentryWrapper('get-user', async (req, res, user) => {
      const { messagingToken }: { messagingToken?: string } = JSON.parse(
        req.body
      );
      if (messagingToken) {
        user.setMessagingToken(messagingToken);
      }
      const songs = await user.getSongs();
      res
        .status(200)
        .type('json')
        .send({
          type: 'success',
          message: { user: user.json, songs: songs },
        });
    })
  )
);

export const setUsername = functions.https.onRequest(
  authMiddleware(
    sentryWrapper('set-username', async (req, res, user) => {
      const { username } = JSON.parse(req.body);
      user.setUsername(username);
      res.status(200).type('json').send({ type: 'success', message: username });
    })
  )
);

export const setMusicPlatform = functions.https.onRequest(
  authMiddleware(
    sentryWrapper('set-music-platform', async (req, res, user) => {
      const { musicPlatform, platformAuthCode } = JSON.parse(req.body);
      user.setMusicPlatform(musicPlatform, platformAuthCode);
      res.status(200).json({ type: 'success', message: musicPlatform });
    })
  )
);

export const unlinkMusicPlatform = functions.https.onRequest(
  authMiddleware(
    sentryWrapper('unlink-music-platform', async (_req, res, user) => {
      user.dbRef.update({ musicPlatform: '' });
      user.dbRef.update({ musicPlatformAuth: {} });
      res.status(200).json({ type: 'success', message: '' });
    })
  )
);
