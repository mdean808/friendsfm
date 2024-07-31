import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const setmusicplatform = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('set-music-platform', async (req, res, user) => {
      const { musicPlatform, platformAuthCode, redirectUrl } = JSON.parse(
        req.body
      );
      await user.setMusicPlatform(
        musicPlatform,
        platformAuthCode,
        redirectUrl || process.env.SPOTIFY_REDIRECT_URLS?.split(',')[0]
      );
      res.status(200).json({ type: 'success', message: musicPlatform });
    })
  )
);
