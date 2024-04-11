import { onRequest } from 'firebase-functions/v2/https';
import { authMiddleware, sentryWrapper } from '../middleware';

export const previewuserfriends = onRequest(
  { cors: true },
  authMiddleware(
    sentryWrapper('preview-user-friends', async (_req, res, user) => {
      let friendSubs = await user.getFriendSubmissions();
      const friends = friendSubs.map((f) => {
        return {
          id: f.id,
          username: f.user?.username,
          musicPlatform: f.user?.musicPlatform,
        };
      });
      res.status(200).json({
        type: 'success',
        message: { friends } || {},
      });
    })
  )
);
