import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import User from '../classes/user';
import * as cors from 'cors';

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
    cors()(req, res, async () => {
      res.set('Access-Control-Allow-Origin', '*');
    });
    try {
      req.body =
        typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
      const { authToken }: { authToken: string } = JSON.parse(req.body);
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
