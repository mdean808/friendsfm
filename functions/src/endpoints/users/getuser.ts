import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const getuser = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('get-user', async (req, res, user) => {
      const { messagingToken }: { messagingToken?: string } = JSON.parse(
        req.body
      );
      if (messagingToken) {
        user.setMessagingToken(messagingToken);
      }
      const songs = await user.getSongs();
      res
        .status(200)
        .type('json')
        .send({
          type: 'success',
          message: { user: user.json, songs: songs },
        });
    })
  )
);
