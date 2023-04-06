import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import User from '../classes/user';

const auth = getAuth();

export const authMiddleware =
  (
    handler: (
      req: functions.https.Request,
      res: functions.Response,
      user: User
    ) => Promise<any>
  ) =>
  async (req: functions.https.Request, res: functions.Response) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { authToken }: { authToken: string } = JSON.parse(req.body);
    try {
      // load and authenticate user
      const id = (await auth.verifyIdToken(authToken)).uid;
      const user = new User(id);
      await user.load();
      if (!user.exists) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        return handler(req, res, user);
      }
    } catch (e) {
      // Firebase authentication error
      res.status(401).json({
        type: 'error',
        message: 'Authentication Failed.',
        error: (e as Error).message,
      });
    }
  };
