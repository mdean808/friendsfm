import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
import User from '../classes/user';
import * as _cors from 'cors';

const cors = _cors({ origin: true });

const auth = getAuth();
// const appCheck = admin.appCheck();

export const corsMiddleware =
  (
    handler: (
      req: functions.https.Request,
      res: functions.Response
    ) => Promise<any>
  ) =>
  async (req: functions.https.Request, res: functions.Response) => {
    // handle preflight requests
    cors(req, res, async () => {
      /*const appCheckToken = req.get('x-firebase-appcheck');
      try {
        if (appCheckToken) {
          await appCheck.verifyToken(appCheckToken);
          return handler(req, res);
        } else {
          throw Error('No App Check token provided');
        }
      } catch (e) {
        console.log('App Check Failed:', e);
        return res.status(401).json({
          type: 'error',
          message: 'App Check Failed.',
        });
      }*/
      return handler(req, res);
    });
  };

export const authMiddleware = (
  handler: (
    req: functions.https.Request,
    res: functions.Response,
    user: User
  ) => Promise<any>
) =>
  corsMiddleware(
    async (req: functions.https.Request, res: functions.Response) => {
      const { authToken }: { authToken: string } = JSON.parse(req.body);
      try {
        // load and authenticate user
        const id = (await auth.verifyIdToken(authToken)).uid;
        const user = new User(id);
        await user.load();
        if (!user.exists) {
          return res
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
    }
  );
