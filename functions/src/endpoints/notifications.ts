import * as functions from 'firebase-functions';
import { sendDaily } from '../lib/notifications';
import { createNotificationTask } from '../lib/tasks';
export const sendNotification = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const data = req.body;
  if (!req.body) {
    res.status(400).end();
    return;
  }
  const secret = data.split('__')[1];
  if (secret === process.env.SECRET) {
    functions.logger.info('Sending Daily Notifications!');
    await sendDaily();
    res.status(200).type('json').send({
      type: 'success',
      message: 'Daily notification sent.',
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
  .schedule('0 0 * * *')
  .onRun(createNotificationTask);
