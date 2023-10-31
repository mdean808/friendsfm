import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';
import Submission from '@/classes/submission';

export const getsubmissionbynumber = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('get-submission-by-number', async (req, res, user) => {
      const number = JSON.parse(req.body).number;
      const userSub = await user.getSubmission(number);
      let friendSubs: Submission[] = [];
      if (userSub) friendSubs = await user.getFriendSubmissions(number);
      res.status(200).json({
        type: 'success',
        message: {
          number,
          userSubmission: userSub ? userSub.json : {},
          friendSubmissions: friendSubs.map((s) => s.json),
        },
      });
    })
  )
);
