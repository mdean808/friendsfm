import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import User from '../classes/user';
import * as _cors from 'cors';

const cors = _cors({ origin: true });

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
    cors(req, res, async () => {
      let id = '';
      try {
        req.body =
          typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
        const { authToken }: { authToken: string } = JSON.parse(req.body);
        // load and authenticate user
        id = (await auth.verifyIdToken(authToken)).uid;
      } catch (e) {
        // Firebase authentication error
        return res.status(401).json({
          type: 'error',
          message: 'Authentication Failed.',
          error: (e as Error).message,
        });
      }
      const user = new User(id);
      await user.load();
      if (!user.exists) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        return handler(req, res, user);
      }
    });
  };
