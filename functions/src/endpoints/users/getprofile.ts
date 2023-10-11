import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';
import User from '@/classes/user';

export const setprofile = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('set-profile', async (req, res) => {
      const { username } = JSON.parse(req.body);
      const user = await User.getByUsername(username);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: user.profile });
    })
  )
);
