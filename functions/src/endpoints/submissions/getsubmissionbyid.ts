import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';
import Submission from '@/classes/submission';

export const getsubmissionbyid = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('get-submission-by-id', async (req, res, user) => {
      const id = JSON.parse(req.body)?.id;
      if (!id) return res.status(400);
      const submission = new Submission(id);
      await submission.load();
      // make sure authenticated is friends with the submission user or is the submitter
      // and has permission to see it
      if (
        user.friends.find((f) => f.id === submission.userId) ||
        user.id === submission.userId
      ) {
        return res.status(200).json({
          type: 'success',
          message: submission.json,
        });
      } else {
        return res.status(401).json({
          type: 'error',
          message: 'You do not have permission to view this submission.',
        });
      }
    })
  )
);
