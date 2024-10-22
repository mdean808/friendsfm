import { AudialAttempt } from '@/types';
import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const setcurrentsubmissionaudialscore = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper(
      'set-current-submission-audial-score',
      async (req, res, user) => {
        const { parsedAudial }: { parsedAudial: AudialAttempt } = JSON.parse(
          req.body
        );
        await (await user.getSubmission())?.setAudial(parsedAudial);
        res.status(200).json({
          type: 'success',
          message: 'success',
        });
      }
    )
  )
);
