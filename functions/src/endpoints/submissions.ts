import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';

const auth = getAuth();

import {
  generateUserSubmission,
  getFriendSubmissions,
  getUserById,
  getUserSubmission,
} from '../lib/db';

import { Submission } from '../types';
export const createNewUserSubmission = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { latitude, longitude, authToken } = JSON.parse(req.body);
    try {
      const id = (await auth.verifyIdToken(authToken)).uid;
      if (!id) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        try {
          const userSub = await generateUserSubmission(id, latitude, longitude);
          const friendSubs: Submission[] = await getFriendSubmissions(id);
          res.status(200).json({
            type: 'success',
            message: { user: userSub || {}, friends: friendSubs || [] },
          });
        } catch (e) {
          functions.logger.info(
            'Error in generateUserSubmission or getFriendSubmissions.'
          );
          functions.logger.error(e);
          res
            .status(400)
            .json({ type: 'error', message: (e as Error).message });
        }
      }
    } catch (e) {
      // firebase authnetication error
      functions.logger.error(e);
      res.status(401).json({
        type: 'error',
        message: 'Authentication Failed.',
        error: (e as Error).message,
      });
    }
  }
);

export const getCurrentSubmissionStatus = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { authToken } = JSON.parse(req.body);
    try {
      const id = (await auth.verifyIdToken(authToken)).uid;
      const userRes = await getUserById(id);
      if (!userRes) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        try {
          const userSub = await getUserSubmission(userRes);
          let friendSubs: Submission[] = [];
          if (userSub) friendSubs = await getFriendSubmissions(userRes);
          res.status(200).json({
            type: 'success',
            message: { user: userSub || {}, friends: friendSubs || [] },
          });
        } catch (e) {
          functions.logger.info(
            'Error in getUserSubmission or getFriendSubmissions.'
          );
          functions.logger.error(e);
          res
            .status(400)
            .type('json')
            .send({ type: 'error', message: (e as Error).message });
        }
      }
    } catch (e) {
      // firebase authnetication error
      functions.logger.error(e);
      res.status(401).json({
        type: 'error',
        message: 'Authentication Failed.',
        error: (e as Error).message,
      });
    }
  }
);
