import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  getMessaging,
  Message,
  TokenMessage,
  TopicMessage,
} from 'firebase-admin/messaging';
import * as functions from 'firebase-functions';
import * as Sentry from '@sentry/node';

const messaging = getMessaging();
const db = getFirestore();

export const sendDaily = async () => {
  const message: Message = {
    notification: {
      title: 'FriendsFM',
      body: 'See what your friends are currently listening to!',
    },
    data: {
      type: 'daily',
    },
    topic: 'all',
    android: {
      priority: 'high',
      notification: {
        priority: 'high',
      },
    },
    apns: {
      payload: {
        aps: {
          'interruption-level': 'time-sensitive',
          badge: 1,
        },
      },
    },
  };

  // Send a message to devices subscribed to the provided topic.
  const res = await messaging.send(message);
  const notificationsRef = db.collection('misc').doc('notifications');
  await notificationsRef.update({ count: FieldValue.increment(1) });
  functions.logger.info('Successfully sent message:', res);
};

export const newNotification = async (message: Message) => {
  // don't send if there is no topic or token set
  if (!(message as TopicMessage).topic && !(message as TokenMessage).token)
    return;
  const transaction = Sentry.startTransaction({
    op: 'notifications.newNotification',
    name: 'send-notification',
  });
  try {
    await messaging.send(message);
  } catch (e) {
    functions.logger.info('Error sending notification:', e);
    transaction.setContext('Notification context', {
      message,
    });
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
};
