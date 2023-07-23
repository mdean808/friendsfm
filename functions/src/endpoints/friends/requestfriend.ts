import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const requestfriend = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('request-friend', async (req, res, user) => {
      const { friend } = JSON.parse(req.body);
      await user.sendRequest(friend);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: 'Friend Request Sent' });
    })
  )
);
