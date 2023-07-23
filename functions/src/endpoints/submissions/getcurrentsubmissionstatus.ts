import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const getcurrentsubmissionstatus = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('get-current-submission-status', async (_req, res, user) => {
      const userSub = await user.getCurrentSubmission();
      res.status(200).json({
        type: 'success',
        message: {
          user: userSub ? userSub.json : {},
        },
      });
    })
  )
);
