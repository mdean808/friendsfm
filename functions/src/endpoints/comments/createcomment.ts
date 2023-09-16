import Submission from '@/classes/submission';
import { authMiddleware, sentryWrapper } from '@/endpoints/middleware';
import { onRequest } from 'firebase-functions/v2/https';

export const createcomment = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('create-comment', async (req, res, user) => {
      const { submissionId, content } = JSON.parse(req.body);
      const submission = new Submission(submissionId);
      await submission.load();
      const comment = await submission.addComment(content, user);
      res.status(200).type('json').send({ type: 'success', message: comment });
    })
  )
);
