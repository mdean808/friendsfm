import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import User from '../classes/user';
import { User as UserType } from '../types';
import { corsMiddleware } from './middleware';

const auth = getAuth();

export const loginUser = functions.https.onRequest(
  corsMiddleware(async (req, res) => {
    const user: UserType = JSON.parse(req.body);
    try {
      // verify the auth token with firebase's backend
      const decodedTokenData = await auth.verifyIdToken(user.authToken);
      user.id = decodedTokenData.uid;
      const userClass = new User(user.id);
      await userClass.load();
      if (userClass.exists) {
        // user has already been registered, send success
        functions.logger.info(`User ${userClass.id} already registered`);
        const songs = await userClass.getSongs();
        res
          .status(200)
          .json({ type: 'success', message: { user: userClass.json, songs } });
      } else {
        try {
          //store user to the database and return user object
          const userRes = await User.create(user);
          res
            .status(200)
            .json({ type: 'success', message: { user: userRes, songs: [] } });
        } catch (e) {
          functions.logger.info('Error in createUser.');
          functions.logger.error(e);
          // error with creating the user
          res.status(400).json({
            type: 'error',
            message: 'Something went wrong. Please try again.',
            error: (e as Error).message,
          });
          return;
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
  })
);
