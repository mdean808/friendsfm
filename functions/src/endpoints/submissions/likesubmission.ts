import Submission from '@/classes/submission';
import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const likesubmission = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('like-submission', async (req, res, user) => {
      const { subId }: { subId: string } = JSON.parse(req.body);
      const submission = new Submission(subId);
      await submission.load();
      await submission.addLike(user);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: submission.likes });
    })
  )
);
