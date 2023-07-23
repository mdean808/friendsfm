import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const createnewusersubmission = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('create-new-user-submission', async (req, res, user) => {
      const { latitude, longitude } = JSON.parse(req.body);
      const userSub = await user.createSubmission(latitude, longitude);
      // because some of our functions aren't running synchronously
      if (res.headersSent) return;
      res.status(200).json({
        type: 'success',
        message: {
          user: userSub.json || {},
        },
      });
    })
  )
);
