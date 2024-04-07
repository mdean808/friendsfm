import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const setsubmissioncaption = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('set-submission-caption', async (req, res, user) => {
      const { caption } = JSON.parse(req.body);
      const sub = await user.getSubmission();
      if (!sub)
        return res.status(400).json({
          type: 'error',
          message: 'Cannot set caption for nonexistant submission.',
        });
      await sub.setCaption(caption);
      return res.status(200).json({
        type: 'success',
        message: caption,
      });
    })
  )
);
