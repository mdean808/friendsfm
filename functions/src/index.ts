import * as functions from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import serviceAccount from '../firebase-auth';
import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  databaseURL: 'https://friendsfm-default-rtdb.firebaseio.com',
});

const auth = getAuth();

import { sendDaily } from './lib/notifications';
import { createNotificationTask } from './lib/tasks';
import { User } from './types';

import {
  createUser,
  getUserByUid as getUserById,
  setUserMusicPreference,
  setUserUsername,
} from './lib/db';

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
      .type('json')
      .send({ type: 'error', message: 'Incorrect secret provided.' });
  }
});

export const generateNotificationTime = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(createNotificationTask);

export const setUsername = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { username, authToken, id } = JSON.parse(req.body);
  try {
    await auth.verifyIdToken(authToken);
    const userRes = await getUserById(id);
    if (!userRes) {
      //WARN: user does not exist
    } else {
      // TODO: handle the errors thrown by this function
      await setUserUsername(id, username);
      res.status(200).type('json').send({ type: 'success', message: username });
    }
  } catch (e) {
    // firebase authnetication error
    functions.logger.error(e);
    res
      .status(400)
      .type('json')
      .send({ type: 'error', message: 'Authentication Failed.' });
  }
});

export const setMusicPreference = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { username: musicPreference, authToken, id } = JSON.parse(req.body);
    try {
      await auth.verifyIdToken(authToken);
      const userRes = await getUserById(id);
      if (!userRes) {
        //WARN: user does not exist
      } else {
        // TODO: handle the errors thrown by this function
        await setUserMusicPreference(id, musicPreference);
        res
          .status(200)
          .type('json')
          .send({ type: 'success', message: musicPreference });
      }
    } catch (e) {
      // firebase authnetication error
      functions.logger.error(e);
      res
        .status(400)
        .type('json')
        .send({ type: 'error', message: 'Authentication Failed.' });
    }
  }
);

export const loginUser = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const user: User = JSON.parse(req.body);

  try {
    // verify the auth token with firebase's backend
    const decodedTokenData = await auth.verifyIdToken(user.authToken);
    user.id = decodedTokenData.uid;
    const userRes = await getUserById(user.id);
    if (userRes) {
      // user has already been registered, send success
      functions.logger.info(`User ${userRes.id} already registered`);
      userRes.registered = true;
      res.status(200).type('json').send({ type: 'success', message: userRes });
    } else {
      try {
        const userRes = await createUser(user);
        //store user to the database and return id
        res
          .status(200)
          .type('json')
          .send({ type: 'success', message: userRes });
      } catch (e) {
        functions.logger.error(e);
        // error with creating the user
        res.status(400).type('json').send({ type: 'error', message: e });
        return;
      }
    }
  } catch (e) {
    // firebase authnetication error
    functions.logger.error(e);
    res
      .status(400)
      .type('json')
      .send({ type: 'error', message: 'Authentication Failed.' });
  }
});
