import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import { createUser, getUserById, getUserSongs } from '../lib/db';
import { User } from '../types';

const auth = getAuth();

export const loginUser = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const user: User = JSON.parse(req.body);

  try {
    // verify the auth token with firebase's backend
    const decodedTokenData = await auth.verifyIdToken(user.authToken);
    user.id = decodedTokenData.uid;
    const userRes = await getUserById(user.id);
    if (userRes) {
      // user has already been registered, send success
      functions.logger.info(`User ${userRes.id} already registered`);
      const songs = await getUserSongs(user.id);
      res
        .status(200)
        .json({ type: 'success', message: { user: userRes, songs } });
    } else {
      try {
        const userRes = await createUser(user);
        //store user to the database and return id
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
});
