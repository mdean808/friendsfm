
import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const getuserstatistics = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('get-user-statistics', async (_req, res, user) => {
      const stats = await user.getStatistics();
      res
        .status(200)
        .type('json')
        .send({
          type: 'success',
          message: stats,
        });
    })
  )
);
