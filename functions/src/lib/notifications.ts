import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging, Message } from 'firebase-admin/messaging';
import * as functions from 'firebase-functions';

const messaging = getMessaging();
const db = getFirestore();

export const sendDaily = async () => {
  const message: Message = {
    notification: {
      title: 'FriendsFM',
      body: 'See what your friends are currently listening to!',
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
  try {
    await messaging.send(message);
  } catch (e) {
    functions.logger.info('Error sending notification:', e);
  }
};
