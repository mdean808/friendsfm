import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const setmusicplatform = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('set-music-platform', async (req, res, user) => {
      const { musicPlatform, platformAuthCode } = JSON.parse(req.body);
      user.setMusicPlatform(musicPlatform, platformAuthCode);
      res.status(200).json({ type: 'success', message: musicPlatform });
    })
  )
);
