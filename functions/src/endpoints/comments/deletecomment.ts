import Submission from '@/classes/submission';
import { authMiddleware, sentryWrapper } from '@/endpoints/middleware';
import { onRequest } from 'firebase-functions/v2/https';

export const deletecomment = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('delete-comment', async (req, res, user) => {
      const { submissionId, commentId, content } = req.body;
      const submission = new Submission(submissionId)
      await submission.load();
      const comment = await submission.removeComment(commentId, content, user.id);
      res.status(200).type('json').send({ type: 'success', comment });
    })
  )
);
