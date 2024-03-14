import { onRequest } from 'firebase-functions/v2/https';
import { logger as firebaseLog, pubsub } from 'firebase-functions';
import { captureCheckIn } from '@sentry/node';
import { createNotificationTask } from '@/lib/tasks';
import { sendDaily } from '@/lib/notifications';

export const sendnotification = onRequest({ cors: true }, async (req, res) => {
  const data = req.body;
  if (!req.body) {
    res.status(400).end();
    return;
  }
  const secret = data.split('__')[1];
  if (secret === process.env.SECRET) {
    firebaseLog.info('Sending Daily Notifications!');
    // hit the createsubmission endpoint so it's loaded before people get the notification
    // should throw an error so we ignore it.
    try {
      fetch('https://createnewusersubmission-tprlxlzyxq-uc.a.run.app', {
        method: 'post',
      });
    } catch {}

    await sendDaily().catch((e) => {
      console.log(e);
    });
    res.status(200).type('json').send({
      type: 'success',
      message: 'Daily notification sent.',
    });
  } else {
    firebaseLog.info(
      'Secret was incorrect: ' + secret + '\nNo notifications sent.'
    );
    res
      .status(401)
      .json({ type: 'error', message: 'Incorrect secret provided.' });
  }
});

export const generateNotificationTime = pubsub
  .schedule('0 0 * * *') // default timezone is America/Los_Angeles
  .onRun(async () => {
    // 🟡 Notify Sentry job is running:
    const checkInId = captureCheckIn({
      monitorSlug: 'generate-daily-notification-time',
      status: 'in_progress',
    });
    try {
      return await createNotificationTask(checkInId);
    } catch (e) {
      console.log(e);
      // 🔴 Notify Sentry job has failed:
      captureCheckIn({
        checkInId,
        monitorSlug: 'generate-daily-notification-time',
        status: 'error',
      });
    }
  });
