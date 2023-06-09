import * as functions from 'firebase-functions';
import { authMiddleware } from './middleware';

export const acceptFriend = functions.https.onRequest(
  authMiddleware(async (req, res, user) => {
    const { requester } = JSON.parse(req.body);
    try {
      const friend = await user.acceptRequest(requester);
      res.status(200).type('json').send({ type: 'success', message: friend });
    } catch (e) {
      functions.logger.info('Error in acceptFriendRequest.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);

export const requestFriend = functions.https.onRequest(
  authMiddleware(async (req, res, user) => {
    try {
      const { friend } = JSON.parse(req.body);
      await user.sendRequest(friend);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: 'Friend Request Sent' });
    } catch (e) {
      functions.logger.info('Error in sendFriendRequest.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);

export const rejectRequest = functions.https.onRequest(
  authMiddleware(async (req, res, user) => {
    try {
      const { requester } = JSON.parse(req.body);
      user.rejectRequest(requester);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: 'Friend Request Removed' });
    } catch (e) {
      functions.logger.info('Error in removeFriendRequest.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);
