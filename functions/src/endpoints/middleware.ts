import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
import User from '../classes/user';
import * as _cors from 'cors';
import * as Sentry from '@sentry/node';

const cors = _cors({ origin: true });

const auth = getAuth();
// const appCheck = admin.appCheck();

export const corsMiddleware =
  (
    handler: (
      req: functions.https.Request,
      res: functions.Response,
      user: User
    ) => Promise<any>
  ) =>
  async (req: functions.https.Request, res: functions.Response) => {
    cors(req, res, async () => {
      // handle preflight requests
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
      return await handler(req, res, {} as User);
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
      // load and authenticate user
      const decodedToken = await auth.verifyIdToken(authToken).catch((e) => {
        // Firebase authentication error
        res.status(401).json({
          type: 'error',
          message: 'Authentication Failed.',
          error: (e as Error).message,
        });
      });
      if (!decodedToken) return;
      const user = new User(decodedToken.uid);
      await user.load();
      if (!user.exists) {
        return res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        return await handler(req, res, user);
      }
    }
  );

export const sentryWrapper =
  (
    name: string,
    handler: (
      req: functions.https.Request,
      res: functions.Response,
      user: User
    ) => Promise<any>
  ) =>
  async (req: functions.https.Request, res: functions.Response, user: User) => {
    // make sure we are in production --- if we aren't just throw the error like normal.
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
      try {
        // 3. Try calling the function handler itself
        return await handler(req, res, user);
      } catch (e) {
        const err = e as Error;
        if (res.headersSent) return;
        if (err.message.includes(':'))
          res.status(500).json({
            type: 'error',
            message: 'Something went wrong. Please try again later.',
            error: err.message,
          });
        else
          res.status(400).json({
            type: 'error',
            message: err.message,
            error: err.message,
          });
        functions.logger.error(err);
      }
    } else {
      // 1. Start the Sentry transaction
      const transaction = Sentry.startTransaction({
        name,
        op: 'functions.https.onRequest',
      });

      // 2. Set the transaction context
      Sentry.setContext('Function context', {
        ...(req.body || req.query || {}),
        function: name,
        op: 'functions.https.onRequest',
      });

      try {
        // 3. Try calling the function handler itself
        return await handler(req, res, user);
      } catch (e) {
        // 4. Send any errors to Sentry
        Sentry.captureException(e);
        await Sentry.flush(1000);

        functions.logger.error('Sentry Error Handled: ' + e);
        // return error response
        if (!res.headersSent)
          res.status(500).json({
            type: 'error',
            message: 'Something went wrong. Please try again later.',
            error: (e as Error).message,
          });
      } finally {
        // 5. Finish the Sentry transaction
        Sentry.configureScope((scope) => scope.clear());
        transaction.finish();
      }
    }
  };
