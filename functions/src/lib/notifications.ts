import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging, Message } from 'firebase-admin/messaging';

const messaging = getMessaging();
const db = getFirestore();

export const sendDaily = async () => {
  const message = {
    notification: {
      title: 'FriendsFM',
      body: 'See what your friends are currently listening to!',
    },
    topic: 'all',
  };

  // Send a message to devices subscribed to the provided topic.
  const res = await messaging.send(message);
  const notificationsRef = db.collection('misc').doc('notifications');
  const prevCount = (await notificationsRef.get()).get('count');
  await notificationsRef.update({ count: prevCount + 1 });
  console.log('Successfully sent message:', res);
};

export const sendToMorgan = async (date: Date) => {
  const message: Message = {
    notification: {
      title: 'New Notification Time Generated',
      body: date.toLocaleTimeString(),
    },
    token: process.env.MORGAN_TOKEN || '',
  };

  const res = await messaging.send(message);
  console.log('Sent message to morgan', res);
};
