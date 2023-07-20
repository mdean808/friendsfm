import * as functions from 'firebase-functions';
import { authMiddleware, sentryWrapper } from './middleware';

export const acceptFriend = sentryWrapper(
  'accept-friend',
  functions.https.onRequest(
    authMiddleware(async (req, res, user) => {
      const { requester } = JSON.parse(req.body);
      const friend = await user.acceptRequest(requester);
      res.status(200).type('json').send({ type: 'success', message: friend });
    })
  )
);

export const requestFriend = sentryWrapper(
  'request-friend',
  functions.https.onRequest(
    authMiddleware(async (req, res, user) => {
      const { friend } = JSON.parse(req.body);
      await user.sendRequest(friend);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: 'Friend Request Sent' });
    })
  )
);

export const rejectRequest = sentryWrapper(
  'reject-friend-request',
  functions.https.onRequest(
    authMiddleware(async (req, res, user) => {
      const { requester } = JSON.parse(req.body);
      user.rejectRequest(requester);
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: 'Friend Request Removed' });
    })
  )
);
