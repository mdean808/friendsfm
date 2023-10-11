import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const setprofile = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('set-profile', async (req, res, user) => {
      const { newProfile } = JSON.parse(req.body);
      user.setProfile(newProfile);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: newProfile });
    })
  )
);
