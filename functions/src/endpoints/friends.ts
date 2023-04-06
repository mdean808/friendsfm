import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import {
  acceptFriendRequest,
  getUserById,
  rejectFriendRequest,
  sendFriendRequest,
} from '../lib/db';

const auth = getAuth();

export const acceptFriend = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { requester, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const userRes = await getUserById(id);
    if (!userRes) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        const friend = await acceptFriendRequest(userRes, requester);
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
});

export const requestFriend = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { friend, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const userRes = await getUserById(id);
    if (!userRes) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await sendFriendRequest(userRes, friend);
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
});

export const rejectRequest = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { requester, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const userRes = await getUserById(id);
    if (!userRes) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await rejectFriendRequest(userRes, requester);
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
});
