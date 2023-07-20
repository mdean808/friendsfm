// import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { getNearbySubmissions } from '../lib/location';
import { createSpotifyPlaylist } from '../lib/spotify';
import { Audial, Song } from '../types';
import { authMiddleware, sentryWrapper } from './middleware';

// const db = getFirestore();

export const createNewUserSubmission = functions.https.onRequest(
  sentryWrapper(
    'create-new-user-submission',

    authMiddleware(async (req, res, user) => {
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
    })
  )
);

export const getCurrentSubmissionStatus = functions.https.onRequest(
  sentryWrapper(
    'get-current-submission-status',

    authMiddleware(async (_req, res, user) => {
      const userSub = await user.getCurrentSubmission();
      res.status(200).json({
        type: 'success',
        message: {
          user: userSub ? userSub.json : {},
        },
      });
    })
  )
);

export const getFriendSubmissions = functions.https.onRequest(
  sentryWrapper(
    'get-friend-submissions',

    authMiddleware(async (_req, res, user) => {
      const friendSubmissions = (await user.getCurrentSubmission())
        ? await user.getFriendSubmissions()
        : [];
      res.status(200).json({
        type: 'success',
        message: {
          friends: friendSubmissions.map((s) => s.json) || [],
        },
      });
    })
  )
);

export const setCurrentSubmissionAudialScore = functions.https.onRequest(
  sentryWrapper(
    'set-current-submission-audial-score',

    authMiddleware(async (req, res, user) => {
      const { parsedAudial }: { parsedAudial: Audial } = JSON.parse(req.body);
      (await user.getCurrentSubmission())?.setAudial(parsedAudial);
      res.status(200).json({
        type: 'success',
        message: 'success',
      });
    })
  )
);

export const createSubmissionsPlaylist = functions.https.onRequest(
  sentryWrapper(
    'create-submissions-playlist',

    authMiddleware(async (_req, res, user) => {
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
    })
  )
);

/* export const submissionMigration = functions.https.onRequest(
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
); */

export const nearbySubmissions = functions.https.onRequest(
  sentryWrapper('nearby-submissions', async (req, res) => {
    //todo: decide if we need auth.
    res.set('Access-Control-Allow-Origin', '*');
    console.log(req.body);
    if (!req.body) res.status(400).end();
    try {
      const data = JSON.parse(req.body);
      if (!data) {
        res.status(400).end();
        return;
      }
      const nearbySubs = await getNearbySubmissions(data.location, 20);
      // sanitize so only user.username, user.id, user.musicplaform, and song and audial data is sent
      const sanitizedSubs = nearbySubs.map((s) => {
        return { song: s.song, user: s.user, audial: s.audial };
      });
      res.status(200).json({ type: 'success', message: sanitizedSubs });
    } catch (e) {
      console.log(e);
      res.status(500).end();
    }
  })
);
