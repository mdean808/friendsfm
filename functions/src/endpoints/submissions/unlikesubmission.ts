import Submission from '@/classes/submission';
import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const unlikesubmission = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('unlike-submission', async (req, res, user) => {
      const { subId }: { subId: string } = JSON.parse(req.body);
      const submission = new Submission(subId);
      await submission.load();
      await submission.unlike(user);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: submission.likes });
    })
  )
);
