import * as functions from 'firebase-functions';
import { authMiddleware, sentryWrapper } from './middleware';

export const acceptFriend = functions.https.onRequest(
  sentryWrapper(
    'accept-friend',

    authMiddleware(async (req, res, user) => {
      const { requester } = JSON.parse(req.body);
      const friend = await user.acceptRequest(requester);
      res.status(200).type('json').send({ type: 'success', message: friend });
    })
  )
);

export const requestFriend = functions.https.onRequest(
  sentryWrapper(
    'request-friend',

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

export const rejectRequest = functions.https.onRequest(
  sentryWrapper(
    'reject-friend-request',

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
