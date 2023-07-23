import { Audial } from '@/types';
import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const setcurrentsubmissionaudialscore = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper(
      'set-current-submission-audial-score',
      async (req, res, user) => {
        const { parsedAudial }: { parsedAudial: Audial } = JSON.parse(req.body);
        (await user.getCurrentSubmission())?.setAudial(parsedAudial);
        res.status(200).json({
          type: 'success',
          message: 'success',
        });
      }
    )
  )
);
