import { authMiddleware, sentryWrapper } from '@/endpoints/middleware';
import { onRequest } from 'firebase-functions/v2/https';

export const acceptfriend = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('accept-friend', async (req, res, user) => {
      const { requester } = JSON.parse(req.body);
      const friend = await user.acceptRequest(requester);
      res.status(200).type('json').send({ type: 'success', message: friend });
    })
  )
);
