import { getFirestore } from 'firebase-admin/firestore';
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
        },
      },
    },
  };

  // Send a message to devices subscribed to the provided topic.
  const res = await messaging.send(message);
  const notificationsRef = db.collection('misc').doc('notifications');
  const prevCount = (await notificationsRef.get()).get('count');
  await notificationsRef.update({ count: prevCount + 1 });
  functions.logger.info('Successfully sent message:', res);
};

export const newNotification = async (message: Message) => {
  const res = await messaging.send(message);
  functions.logger.info('Sent message to morgan', res);
};
