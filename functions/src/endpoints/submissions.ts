import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';
import User from '../classes/user';

const auth = getAuth();

import { createSpotifyPlaylist } from '../lib/spotify';

import { Audial, Song } from '../types';
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
      const user = new User(id, authToken);
      await user.load();
      if (!user.exists) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
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
      const user = new User(id);
      await user.load();
      if (!user.exists) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
        try {
          (await user.getCurrentSubmission()).setAudial(parsedAudial);
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
      const user = new User(id, authToken);
      await user.load();
      if (!user.exists) {
        res
          .status(400)
          .json({ type: 'error', message: 'User does not exist.' });
      } else {
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
