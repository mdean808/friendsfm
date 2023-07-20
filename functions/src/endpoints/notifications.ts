import * as functions from 'firebase-functions';
import { sendDaily } from '../lib/notifications';
import { createNotificationTask } from '../lib/tasks';
import * as Sentry from '@sentry/node';

export const sendNotification = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const data = req.body;
  if (!req.body) {
    res.status(400).end();
    return;
  }
  const secret = data.split('__')[1];
  if (secret === process.env.SECRET) {
    // 🟡 Notify Sentry job is running:
    const checkInId = Sentry.captureCheckIn({
      monitorSlug: 'daily-notification-sent',
      status: 'in_progress',
    });
    functions.logger.info('Sending Daily Notifications!');
    await sendDaily().catch((e) => {
      console.log(e);
      // 🔴 Notify Sentry job has failed:
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: 'daily-notification-sent',
        status: 'error',
      });
    });
    res.status(200).type('json').send({
      type: 'success',
      message: 'Daily notification sent.',
    });
    // 🟢 Notify Sentry job has completed successfully:
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: 'daily-notification-sent',
      status: 'ok',
    });
  } else {
    functions.logger.info(
      'Secret was incorrect: ' + secret + '\nNo notifications sent.'
    );
    res
      .status(401)
      .json({ type: 'error', message: 'Incorrect secret provided.' });
  }
});

export const generateNotificationTime = functions.pubsub
  .schedule('0 0 * * *') // default timezone is America/Los_Angeles
  .onRun(() => {
    // 🟡 Notify Sentry job is running:
    const checkInId = Sentry.captureCheckIn({
      monitorSlug: 'generate-daily-notification-time',
      status: 'in_progress',
    });
    createNotificationTask(checkInId).catch((e) => {
      console.log(e);
      // 🔴 Notify Sentry job has failed:
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: 'generate-daily-notification-time',
        status: 'error',
      });
    });
  });
