import * as functions from 'firebase-functions';
import { CloudTasksClient } from '@google-cloud/tasks';
import { sendToMorgan } from './notifications';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
const db = getFirestore();
const client = new CloudTasksClient();

export const createNotificationTask = async () => {
  const project = 'friendsfm';
  const queue = 'notification-time';
  const location = 'us-west1';
  const url =
    'https://us-central1-friendsfm.cloudfunctions.net/sendNotification';
  const notificationTime = getRandomDate(
    new Date(new Date().getTime() + 6 * 60 * 60 * 1000),
    new Date(new Date().getTime() + 21 * 60 * 60 * 1000)
  );
  const payload = notificationTime.toString();
  // calculate seconds until the random time
  const inSeconds = (notificationTime.getTime() - new Date().getTime()) / 1000;

  // Construct the fully qualified queue name.
  const parent = client.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      headers: {
        'Content-Type': 'text/plain',
      },
      body: '',
      httpMethod: 'POST' as const, // for some reason it needs the "POST" type
      url,
    },
    scheduleTime: {
      seconds: inSeconds + Date.now() / 1000,
    },
  };

  if (payload)
    task.httpRequest.body = Buffer.from(
      payload + '__' + process.env.SECRET
    ).toString('base64');

  // save notifcation time
  const notifTime = new Date(inSeconds * 1000 + Date.now());
  const notificationsRef = db.collection('misc').doc('notifications');

  await notificationsRef.update({ time: Timestamp.fromDate(notifTime) });

  // Send create task request.
  const request = { parent: parent, task: task };
  await client.createTask(request);
  functions.logger.info('Task Created');
  await sendToMorgan(notificationTime);
};

const getRandomDate = (from: Date, to: Date) => {
  const fromTime = from.getTime();
  const toTime = to.getTime();
  return new Date(fromTime + Math.random() * (toTime - fromTime));
};
