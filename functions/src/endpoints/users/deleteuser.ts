import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const deleteuser = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('get-user', async (_req, res, user) => {
      await user.delete();
      res.status(200).type('json').send({
        type: 'success',
        message: 'Successfully removed user data.',
      });
    })
  )
);
