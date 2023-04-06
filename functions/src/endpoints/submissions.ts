import * as functions from 'firebase-functions';
import { createSpotifyPlaylist } from '../lib/spotify';
import { Audial, Song } from '../types';
import { authMiddleware } from './middleware';

export const createNewUserSubmission = functions.https.onRequest(
  authMiddleware(async (req, res, user) => {
    try {
      const { latitude, longitude } = JSON.parse(req.body);
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
      const friendSubmissions = await user.getFriendSubmissions();
      res.status(200).json({
        type: 'success',
        message: {
          user: userSub.json || {},
          friends: friendSubmissions.map((s) => s.json) || [],
        },
      });
    } catch (e) {
      functions.logger.info(
        'Error in getUserSubmission or getFriendSubmissions.'
      );
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
      (await user.getCurrentSubmission()).setAudial(parsedAudial);
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
