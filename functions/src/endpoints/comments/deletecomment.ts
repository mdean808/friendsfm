import Submission from '@/classes/submission';
import { authMiddleware, sentryWrapper } from '@/endpoints/middleware';
import { onRequest } from 'firebase-functions/v2/https';

export const deletecomment = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('delete-comment', async (req, res, user) => {
      const { submissionId, comment } = JSON.parse(req.body);
      const submission = new Submission(submissionId);
      await submission.load();
      if (user.id === comment.user.id) {
        await submission.removeComment(comment);
        res.status(200).type('json').send({
          type: 'success',
          message: submission.json,
        });
      } else {
        res.status(401).type('json').send({
          type: 'error',
          message: 'Delete failed: User unauthorized.',
        });
      }
    })
  )
);
