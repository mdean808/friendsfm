import { CustomError } from '@/classes/error';
import { logger as firebaseLog } from 'firebase-functions';

export const sendExceptionToSentry = async (
  name: string,
  error: Error | CustomError,
  data: object
) => {
  // make sure we are in production --- if we aren't just throw the error like normal.
  if (process.env.FUNCTIONS_EMULATOR === 'true') return;
  // dynamic imports to improve cold start times
  const {
    startTransaction,
    configureScope,
    setContext,
    captureException,
    flush,
  } = await import('@sentry/node');
  const transaction = startTransaction({
    name,
    op: 'functions.https.onRequest',
  });

  // 2. Setup scope information
  configureScope((scope) => {
    scope.addEventProcessor((event) => {
      event.transaction = transaction.name;

      const mechanism = event.exception?.values?.[0].mechanism;
      if (mechanism && event.tags?.handled === false) {
        mechanism.handled = false;
      }
      return event;
    });
    scope.setSpan(transaction);
  });

  // 3. Set the transaction context (sanitize body)
  setContext('Function context', {
    ...data,
    function: name,
    op: 'functions.https.onRequest',
  });

  // return error response
  const err = error as Error | CustomError;
  // 4. Send any errors to Sentry
  captureException(error, { tags: { handled: true } });

  firebaseLog.error(
    `Sentry Error Handled: ${err.name}: ${err.message}\n${err.stack}`
  );
  // 5. Finish the Sentry transaction
  configureScope((scope) => scope.clear());
  transaction.finish();
  await flush(1000);
};
