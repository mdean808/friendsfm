import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';
import User from '@/classes/user';

export const getprofile = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('get-profile', async (req, res) => {
      const { username } = JSON.parse(req.body);
      const user = await User.getByUsername(username);
      const stats = await user.getStatistics();
      user.profile.stats = stats;
      if (!user.profile.musicPlatform)
        user.profile.musicPlatform === user.musicPlatform;
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: user.profile });
    })
  )
);
