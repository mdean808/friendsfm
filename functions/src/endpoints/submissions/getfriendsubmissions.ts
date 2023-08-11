import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const getfriendsubmissions = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('get-friend-submissions', async (_req, res, user) => {
      const friendSubmissions = (await user.getSubmission())
        ? await user.getFriendSubmissions()
        : [];
      res.status(200).json({
        type: 'success',
        message: {
          friends: friendSubmissions.map((s) => s.json) || [],
        },
      });
    })
  )
);
