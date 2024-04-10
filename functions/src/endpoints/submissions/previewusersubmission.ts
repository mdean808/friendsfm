import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const previewusersubmission = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('preview-user-submission', async (req, res, user) => {
      const { appleMusic } = JSON.parse(req.body);
      const submission = await user.previewSubmission(appleMusic);
      let friendSubs = await user.getFriendSubmissions();
      const friends = friendSubs.map((f) => {
        return {
          id: f.id,
          username: f.user?.username,
          musicPlatform: f.user?.musicPlatform,
        };
      });
      // because some of our functions aren't running synchronously
      if (res.headersSent) return;
      res.status(200).json({
        type: 'success',
        message: { submission: submission.json, friends } || {},
      });
    })
  )
);
