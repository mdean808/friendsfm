import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const previewusersubmission = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('preview-user-submission', async (req, res, user) => {
      const { appleMusic } = JSON.parse(req.body);
      const submission = await user.previewSubmission(appleMusic);
      res.status(200).json({
        type: 'success',
        message: { submission: submission.json, friends: [] } || {},
      });
    })
  )
);
