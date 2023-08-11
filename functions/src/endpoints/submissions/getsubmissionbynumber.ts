import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { authMiddleware, sentryWrapper } from '../middleware';
import Submission from '@/classes/submission';

export const getsubmissionbynumber = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('get-submission-by-number', async (req, res, user) => {
      const number = JSON.parse(req.body).number;
      //todo: handle numbers that don't exist
      logger.info('route: ' + number);
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
