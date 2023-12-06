import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const getfriendsuggestions = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('request-friend', async (_req, res, user) => {
      const suggestions = await user.getFriendSuggestions();
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: suggestions });
    })
  )
);
