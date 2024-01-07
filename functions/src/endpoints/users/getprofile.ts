import { onRequest } from 'firebase-functions/v2/https';
import { emptyMiddleware, sentryWrapper } from '../middleware';
import User from '@/classes/user';

export const getprofile = onRequest(
  { cors: true },
  emptyMiddleware(
    sentryWrapper('get-profile', async (req, res) => {
      const { username } = JSON.parse(req.body);
      const user = await User.getByUsername(username);
      const stats = await user.getStatistics();
      const profile = user.profile;
      profile.stats = stats;
      if (!profile.musicPlatform) profile.musicPlatform = user.musicPlatform;
      res.status(200).type('json').send({ type: 'success', message: profile });
    })
  )
);
