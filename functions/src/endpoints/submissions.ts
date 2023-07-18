import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { getNearbySubmissions } from '../lib/location';
import { createSpotifyPlaylist } from '../lib/spotify';
import { Audial, Song } from '../types';
import { authMiddleware } from './middleware';

const db = getFirestore();

export const createNewUserSubmission = functions.https.onRequest(
  authMiddleware(async (req, res, user) => {
    try {
      const { latitude, longitude } = JSON.parse(req.body);
      const userSub = await user.createSubmission(latitude, longitude);
      // because some of our functions aren't running synchronously
      if (res.headersSent) return;
      res.status(200).json({
        type: 'success',
        message: {
          user: userSub.json || {},
        },
      });
    } catch (e) {
      functions.logger.info('Error in generateUserSubmission.');
      functions.logger.error((e as Error).message);
      // because some of our functions aren't running synchronously
      if (res.headersSent) return;
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);

export const getCurrentSubmissionStatus = functions.https.onRequest(
  authMiddleware(async (_req, res, user) => {
    try {
      const userSub = await user.getCurrentSubmission();
      res.status(200).json({
        type: 'success',
        message: {
          user: userSub ? userSub.json : {},
        },
      });
    } catch (e) {
      functions.logger.info('Error in getUserSubmission.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);

export const getFriendSubmissions = functions.https.onRequest(
  authMiddleware(async (_req, res, user) => {
    try {
      const friendSubmissions = (await user.getCurrentSubmission())
        ? await user.getFriendSubmissions()
        : [];
      res.status(200).json({
        type: 'success',
        message: {
          friends: friendSubmissions.map((s) => s.json) || [],
        },
      });
    } catch (e) {
      functions.logger.info('Error in getFriendSubmissions.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);

export const setCurrentSubmissionAudialScore = functions.https.onRequest(
  authMiddleware(async (req, res, user) => {
    try {
      const { parsedAudial }: { parsedAudial: Audial } = JSON.parse(req.body);
      (await user.getCurrentSubmission())?.setAudial(parsedAudial);
      res.status(200).json({
        type: 'success',
        message: 'success',
      });
    } catch (e) {
      functions.logger.info('Error in Submission.setAudial.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);

export const createSubmissionsPlaylist = functions.https.onRequest(
  authMiddleware(async (_req, res, user) => {
    try {
      const songs: Song[] = [];
      const song = (await user.getCurrentSubmission())?.song || null;
      if (song) songs.push(song);
      const friendSubmissions = await user.getFriendSubmissions();
      for (const sub of friendSubmissions) {
        songs.push(sub.song);
      }
      await user.updateMusicAuth();
      const playlistUrl = await createSpotifyPlaylist(
        user.musicPlatformAuth,
        songs,
        'friendsfm - submissions',
        "rotating playlist of your friend's friendsfm submissions",
        true
      );
      await user.dbRef.update({ submissionsPlaylist: playlistUrl });
      res
        .status(200)
        .type('json')
        .send({ type: 'success', message: playlistUrl });
    } catch (e) {
      functions.logger.info('Error in createSubmissionsPlaylist.');
      functions.logger.error(e);
      res.status(400).json({
        type: 'error',
        message: 'Something went wrong. Please try again.',
        error: (e as Error).message,
      });
    }
  })
);

export const submissionMigration = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const data = JSON.parse(req.body);
    if (!data) {
      res.status(400).end();
      return;
    }
    if (data.secret === process.env.SECRET) {
      const users = await db.collection('users').listDocuments();
      const submissionsRef = db.collection('submissions');
      // for each user
      for (const user of users) {
        const uSubs = await user.collection('submissions').listDocuments();
        // for each submission in a given user
        for (const subRef of uSubs) {
          // get the submission data
          const sub = await subRef.get();
          const data = { ...sub.data(), userId: (await user.get()).get('id') };
          // save submission data to the new collection
          if (data) await submissionsRef.add(data);
        }
      }
      res.status(200).end();
    } else {
      res.status(401).end();
    }
  }
);

export const nearbySubmissions = functions.https.onRequest(async (req, res) => {
  //todo: decide if we need auth.
  res.set('Access-Control-Allow-Origin', '*');
  if (!req.body) res.status(400).end();
  try {
    const data = JSON.parse(req.body);
    if (!data) {
      res.status(400).end();
      return;
    }
    const nearbySubs = await getNearbySubmissions(data.location, 20);
    res
      .status(200)
      .json({ type: 'success', message: nearbySubs.map((s) => s.song.genre) });
  } catch (e) {}
});
