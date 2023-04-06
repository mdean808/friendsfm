import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import User from '../classes/user';

const auth = getAuth();

export const acceptFriend = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { requester, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const user = new User(id);
    await user.load();
    if (!user.exists) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        const friend = await user.acceptRequest(requester);
        res.status(200).type('json').send({ type: 'success', message: friend });
      } catch (e) {
        functions.logger.info('Error in acceptFriendRequest.');
        functions.logger.error(e);
        res.status(400).json({ type: 'error', message: (e as Error).message });
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
    const user = new User(id);
    await user.load();
    if (!user.exists) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await user.acceptRequest(friend);
        res
          .status(200)
          .type('json')
          .send({ type: 'success', message: 'Friend Request Sent' });
      } catch (e) {
        functions.logger.info('Error in sendFriendRequest.');
        functions.logger.error(e);
        res.status(400).json({ type: 'error', message: (e as Error).message });
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
    const user = new User(id);
    await user.load();
    if (!user.exists) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await user.rejectRequest(requester);
        res
          .status(200)
          .type('json')
          .send({ type: 'success', message: 'Friend Request Removed' });
      } catch (e) {
        functions.logger.info('Error in removeFriendRequest.');
        functions.logger.error(e);
        res.status(400).json({ type: 'error', message: (e as Error).message });
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
