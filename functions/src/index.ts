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
import { Submission, User } from './types';

import {
  acceptFriendRequest,
  createUser,
  generateUserSubmission,
  getFriendSubmissions,
  getUserByUid as getUserById,
  getUserSubmission,
  sendFriendRequest,
  setUserMusicPlatform,
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
      .json({ type: 'error', message: 'Incorrect secret provided.' });
  }
});

export const generateNotificationTime = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(createNotificationTask);

export const createNewUserSubmission = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { latitude, longitude, authToken } = JSON.parse(req.body);
    try {
      const id = (await auth.verifyIdToken(authToken)).uid;
      const userRes = await getUserById(id);
      if (!userRes) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        try {
          const userSub = await generateUserSubmission(id, latitude, longitude);
          const friendSubs: Submission[] = await getFriendSubmissions(id);
          res.status(200).json({
            type: 'success',
            message: { user: userSub || {}, friends: friendSubs || [] },
          });
        } catch (e) {
          functions.logger.info(
            'Error in generateUserSubmission or getFriendSubmissions.'
          );
          functions.logger.error(e);
          res
            .status(400)
            .json({ type: 'error', message: (e as Error).message });
        }
      }
    } catch (e) {
      // firebase authnetication error
      functions.logger.error(e);
      res.status(401).json({
        type: 'error',
        message: 'Authentication Failed.',
        error: (e as Error).message,
      });
    }
  }
);

export const getCurrentSubmissionStatus = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { authToken } = JSON.parse(req.body);
    try {
      const id = (await auth.verifyIdToken(authToken)).uid;
      const userRes = await getUserById(id);
      if (!userRes) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        try {
          const userSub = await getUserSubmission(id);
          let friendSubs: Submission[] = [];
          if (userSub) friendSubs = await getFriendSubmissions(id);
          res.status(200).json({
            type: 'success',
            message: { user: userSub || {}, friends: friendSubs || [] },
          });
        } catch (e) {
          functions.logger.info(
            'Error in getUserSubmission or getFriendSubmissions.'
          );
          functions.logger.error(e);
          res
            .status(400)
            .type('json')
            .send({ type: 'error', message: (e as Error).message });
        }
      }
    } catch (e) {
      // firebase authnetication error
      functions.logger.error(e);
      res.status(401).json({
        type: 'error',
        message: 'Authentication Failed.',
        error: (e as Error).message,
      });
    }
  }
);

export const setUsername = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { username, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const userRes = await getUserById(id);
    if (!userRes) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await setUserUsername(id, username);
        res
          .status(200)
          .type('json')
          .send({ type: 'success', message: username });
      } catch (e) {
        functions.logger.info('Error in setUserUsername.');
        functions.logger.error(e);
        res.status(400).json({ type: 'error', message: (e as Error).message });
      }
    }
  } catch (e) {
    // firebase authnetication error
    functions.logger.error(e);
    res.status(401).json({
      type: 'error',
      message: 'Authentication Failed.',
      error: (e as Error).message,
    });
  }
});

export const setMusicPlatform = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { musicPlatform, platformAuthCode, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const userRes = await getUserById(id);
    if (!userRes) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await setUserMusicPlatform(id, musicPlatform, platformAuthCode);
        res.status(200).json({ type: 'success', message: musicPlatform });
      } catch (e) {
        functions.logger.info('Error in setMusicPlatform.');
        functions.logger.error(e);
        res.status(400).json({ type: 'error', message: (e as Error).message });
      }
    }
  } catch (e) {
    // firebase authnetication error
    functions.logger.error(e);
    res.status(401).json({
      type: 'error',
      message: 'Authentication Failed.',
      error: (e as Error).message,
    });
  }
});

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
      res.status(200).json({ type: 'success', message: userRes });
    } else {
      try {
        const userRes = await createUser(user);
        //store user to the database and return id
        res.status(200).json({ type: 'success', message: userRes });
      } catch (e) {
        functions.logger.info('Error in createUser.');
        functions.logger.error(e);
        // error with creating the user
        res.status(400).json({ type: 'error', message: (e as Error).message });
        return;
      }
    }
  } catch (e) {
    // firebase authnetication error
    functions.logger.error(e);
    res.status(401).json({
      type: 'error',
      message: 'Authentication Failed.',
      error: (e as Error).message,
    });
  }
});

export const acceptFriend = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { requester, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const userRes = await getUserById(id);
    if (!userRes) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await acceptFriendRequest(userRes, requester);
        res
          .status(200)
          .type('json')
          .send({ type: 'success', message: 'Friend Frequest Accepted' });
      } catch (e) {
        functions.logger.info('Error in acceptFriendRequest.');
        functions.logger.error(e);
        res.status(400).json({ type: 'error', message: (e as Error).message });
      }
    }
  } catch (e) {
    // firebase authnetication error
    functions.logger.error(e);
    res.status(401).json({
      type: 'error',
      message: 'Authentication Failed.',
      error: (e as Error).message,
    });
  }
});

export const requestFriend = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const { friend, authToken } = JSON.parse(req.body);
  try {
    const id = (await auth.verifyIdToken(authToken)).uid;
    const userRes = await getUserById(id);
    if (!userRes) {
      res.status(400).json({ type: 'error', message: 'User does not exist.' });
    } else {
      try {
        await sendFriendRequest(userRes, friend);
        res
          .status(200)
          .type('json')
          .send({ type: 'success', message: 'Friend Request Sent' });
      } catch (e) {
        functions.logger.info('Error in sendFriendRequest.');
        functions.logger.error(e);
        res.status(400).json({ type: 'error', message: (e as Error).message });
      }
    }
  } catch (e) {
    // firebase authnetication error
    functions.logger.error(e);
    res.status(401).json({
      type: 'error',
      message: 'Authentication Failed.',
      error: (e as Error).message,
    });
  }
});
