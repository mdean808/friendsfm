import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const rejectrequest = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('reject-friend-request', async (req, res, user) => {
      const { requester } = JSON.parse(req.body);
      user.rejectRequest(requester);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: 'Friend Request Removed' });
    })
  )
);
