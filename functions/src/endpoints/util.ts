import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import User from '@/classes/user';

const db = getFirestore();

export const updateuserthing = onRequest({ cors: true }, async (_req, res) => {
  try {
    const users = await db.collection('users').listDocuments();
    console.log(users[0].id);
    users.forEach(async (doc) => {
      const u = new User(doc.id);
      await u.load();
    });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
  res.sendStatus(200);
});

export const converttimestampstodate = onRequest(
  { cors: true },
  async (_req, res) => {
    res.sendStatus(200);
  }
);
