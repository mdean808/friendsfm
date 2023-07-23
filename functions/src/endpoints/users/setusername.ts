import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const setusername = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('set-username', async (req, res, user) => {
      const { username } = JSON.parse(req.body);
      user.setUsername(username);
      res.status(200).type('json').send({ type: 'success', message: username });
    })
  )
);
