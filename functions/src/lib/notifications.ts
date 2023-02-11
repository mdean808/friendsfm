import { getMessaging, Message } from 'firebase-admin/messaging';

const messaging = getMessaging();

export const sendDaily = async () => {
  const topic = 'all';

  const message = {
    notification: {
      title: 'FriendsFM',
      body: 'See what your friends are currently listening to!',
    },
    topic: topic,
  };

  // Send a message to devices subscribed to the provided topic.
  const res = await messaging.send(message);
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
