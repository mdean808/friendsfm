import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const setmusicplatform = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('set-music-platform', async (req, res, user) => {
      const { musicPlatform, platformAuthCode, musicPlatformAuth } = JSON.parse(
        req.body
      );
      // special musicPlatformAuth for web authentication
      if (musicPlatformAuth) {
        user.musicPlatformAuth = musicPlatformAuth;
        user.public.musicPlatform = musicPlatform;
        await user.dbRef.update({ musicPlatformAuth, musicPlatform });
      } else {
        await user.setMusicPlatform(musicPlatform, platformAuthCode);
      }
      res.status(200).json({ type: 'success', message: musicPlatform });
    })
  )
);
