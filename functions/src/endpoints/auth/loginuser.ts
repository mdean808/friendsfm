import { getAuth } from 'firebase-admin/auth';
import { onRequest } from 'firebase-functions/v2/https';
import { logger as firebaseLog } from 'firebase-functions';
import User from '@/classes/user';
import { User as UserType } from '@/types';
import { emptyMiddleware, sentryWrapper } from '@/endpoints/middleware';

const auth = getAuth();

export const loginuser = onRequest(
  { cors: true },
  emptyMiddleware(
    sentryWrapper('login-user', async (req, res) => {
      req.body =
        typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
      const user: UserType = JSON.parse(req.body);

      let authToken = req.get('Authentication')?.split(' ')[1];
      if (!authToken) authToken = JSON.parse(req.body)?.authToken;
      // verify the auth token with firebase's backend
      const decodedTokenData = await auth
        .verifyIdToken(authToken || '')
        .catch((e) => {
          // firebase authnetication failed
          firebaseLog.error(e);
          res.status(401).json({
            type: 'error',
            message: 'Authentication Failed.',
            error: (e as Error).message,
          });
        });
      // auth failed so we end the function
      if (!decodedTokenData) return;
      user.id = decodedTokenData.uid;
      const userClass = new User(user.id);
      await userClass.load();
      if (userClass.exists) {
        // user has already been registered, send success
        firebaseLog.info(`User ${userClass.id} already registered`);
        const songs = await userClass.getSongs();
        res.status(200).json({
          type: 'success',
          message: { user: userClass.json, songs },
        });
      } else {
        //store user to the database and return user object
        const userRes = await User.create(user);
        res
          .status(200)
          .json({ type: 'success', message: { user: userRes, songs: [] } });
      }
    })
  )
);
