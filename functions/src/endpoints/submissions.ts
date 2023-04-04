import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import User from '../classes/user';

const auth = getAuth();
const db = getFirestore();

import {
  getFriendSubmissions,
  getUserById,
  getUserSubmission,
  setUserCurrentSubmissionAudialScore,
} from '../lib/db';
import {
  refreshSpotifyAccessCode,
  createSpotifyPlaylist,
} from '../lib/spotify';

import {
  Audial,
  MusicPlatformAuth,
  Song,
  Submission,
  User as UserType,
} from '../types';
export const createNewUserSubmission = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { latitude, longitude, authToken } = JSON.parse(req.body);
    try {
      const id = (await auth.verifyIdToken(authToken)).uid;
      const user = new User(id, authToken);
      await user.load();
      if (!user.exists) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        try {
          const userSub = await user.createSubmission(latitude, longitude);
          const friendSubmissions = await user.getFriendSubmissions();
          // because some of our functions aren't running synchronously
          if (res.headersSent) return;
          res.status(200).json({
            type: 'success',
            message: {
              user: userSub.json || {},
              friends: friendSubmissions.map((s) => s.json) || [],
            },
          });
        } catch (e) {
          functions.logger.info(
            'Error in generateUserSubmission or getFriendSubmissions.'
          );
          functions.logger.error((e as Error).message);
          // because some of our functions aren't running synchronously
          if (res.headersSent) return;
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
          const userSub = await getUserSubmission(userRes);
          let friendSubs: Submission[] = [];
          if (userSub) friendSubs = await getFriendSubmissions(userRes);
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

export const setCurrentSubmissionAudialScore = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const {
      parsedAudial,
      authToken,
    }: { parsedAudial: Audial; authToken: string } = JSON.parse(req.body);
    try {
      const id = (await auth.verifyIdToken(authToken)).uid;
      if (!id) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        try {
          await setUserCurrentSubmissionAudialScore(id, parsedAudial);
          res.status(200).json({
            type: 'success',
            message: 'success',
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

export const createSubmissionsPlaylist = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const { authToken }: { authToken: string } = JSON.parse(req.body);
    try {
      const id = (await auth.verifyIdToken(authToken)).uid;
      if (!id) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        try {
          const userRef = db.collection('users').doc(id);
          const user = await userRef.get();
          const musicPlatformAuth = user.get(
            'musicPlatformAuth'
          ) as MusicPlatformAuth;
          const accessCode = await refreshSpotifyAccessCode(
            musicPlatformAuth,
            userRef
          );
          const songs: Song[] = [];
          const song =
            (await getUserSubmission(user.data() as UserType))?.song || null;
          if (song) songs.push(song);
          const friendSubmissions = await getFriendSubmissions(
            user.data() as UserType
          );
          for (const sub of friendSubmissions) {
            songs.push(sub.song);
          }
          musicPlatformAuth.access_token = accessCode;
          const playlistUrl = await createSpotifyPlaylist(
            musicPlatformAuth,
            songs,
            'friendsfm - submissions',
            "rotating playlist of your friend's friendsfm submissions",
            true
          );
          userRef.update({ submissionsPlaylist: playlistUrl });
          res
            .status(200)
            .type('json')
            .send({ type: 'success', message: playlistUrl });
        } catch (e) {
          functions.logger.info('Error in createLikedSongsPlaylist.');
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
