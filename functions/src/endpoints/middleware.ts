import { logger as firebaseLog } from 'firebase-functions';
import User from '../classes/user';
import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'firebase-functions';

export const emptyMiddleware =
  (handler: (req: Request, res: Response, user: User) => Promise<any>) =>
  async (req: Request, res: Response) => {
    return await handler(req, res, {} as User);
  };

export const appCheckMiddleware =
  (handler: (req: Request, res: Response, user: User) => Promise<any>) =>
  async (req: Request, res: Response) => {
    const admin = await import('firebase-admin');
    const appCheck = admin.appCheck();
    const appCheckToken = req.get('x-firebase-appcheck');
    try {
      if (appCheckToken) {
        await appCheck.verifyToken(appCheckToken);
        return await handler(req, res, {} as User);
      } else {
        throw Error('No App Check token provided');
      }
    } catch (e) {
      console.log('App Check Failed:', e);
      return res.status(401).json({
        type: 'error',
        message: 'App Check Failed.',
      });
    }
  };

export const authMiddleware =
  (handler: (req: Request, res: Response, user: User) => Promise<any>) =>
  async (req: Request, res: Response) => {
    const { getAuth } = await import('firebase-admin/auth');
    const auth = getAuth();

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
  };

export const sentryWrapper =
  (
    name: string,
    handler: (req: Request, res: Response, user: User) => Promise<any>
  ) =>
  async (req: Request, res: Response, user: User) => {
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
        firebaseLog.error(err);
      }
    } else {
      // dynamic imports to improve cold start times
      const {
        extractTraceparentData,
        startTransaction,
        configureScope,
        setContext,
        captureException,
        flush,
        addRequestDataToEvent,
      } = await import('@sentry/node');
      const { getLocationHeaders } = await import('../lib/location');
      // Note: see https://gist.github.com/zanona/0f3d42093eaa8ac5c33286cc7eca1166 for parts of sentry wrapper implementation
      // 1. Start the Sentry transaction
      const traceparentData = extractTraceparentData(
        req.header('sentry-trace') || ''
      );
      const transaction = startTransaction({
        name,
        op: 'functions.https.onRequest',
        ...traceparentData,
      });

      // 2. Setup scope information
      configureScope((scope) => {
        scope.addEventProcessor((event) => {
          addRequestDataToEvent(event, req);
          const loc = getLocationHeaders(req);
          if (loc.ip && event.user)
            Object.assign(event.user, { ip_address: loc.ip });
          if (loc.country && event.user)
            Object.assign(event.user, { country: loc.country });
          event.transaction = transaction.name;

          const mechanism = event.exception?.values?.[0].mechanism;
          if (mechanism && event.tags?.handled === false) {
            mechanism.handled = false;
          }
          return event;
        });
        scope.setSpan(transaction);
      });

      // 3. Set the transaction context
      setContext('Function context', {
        ...(req.body || req.query || {}),
        function: name,
        op: 'functions.https.onRequest',
      });

      try {
        // 3. Try calling the function handler itself
        return await handler(req, res, user);
      } catch (e) {
        // return error response
        if (!res.headersSent)
          res.status(500).json({
            type: 'error',
            message: 'Something went wrong. Please try again later.',
            error: (e as Error).message,
          });
        // 4. Send any errors to Sentry
        captureException(e, { tags: { handled: false } });

        firebaseLog.error('Sentry Error Handled: ' + e);
      } finally {
        // 5. Finish the Sentry transaction
        configureScope((scope) => scope.clear());
        transaction.finish();
        await flush(1000);
      }
    }
  };
