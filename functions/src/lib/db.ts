import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  Submission,
  User,
  Song,
  MusicPlatform,
  SpotifyAuthRes,
} from '../types';
import * as functions from 'firebase-functions';
import { checkSpotifyAccessCode, getCurrentSpotifySong } from './spotify';

const SPOTIFY_AUTH = Buffer.from(
  process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
).toString('base64');
const db = getFirestore();

export const getUserByUid = async (uid: string) => {
  const usersRef = db.collection('users');
  const res = await usersRef.doc(uid).get();
  return res.data() as User;
};

export const createUser = async (user: User) => {
  // check if the email. username already exists
  const usersRef = db.collection('users');
  if ((await usersRef.where('email', '==', user.email).get()).docs[0]) {
    throw new Error(`Email '${user.email}' already registered.`);
  }

  if ((await usersRef.doc(user.id).get()).exists) {
    console.log(
      'uid token',
      user.id,
      (await usersRef.doc(user.id).get()).exists
    );
    throw new Error(
      'User ID taken. (Perhaps the user has already registered.)'
    );
  }

  const newUserRef = db.collection('users').doc(user.id);
  user.friends = [];
  await newUserRef.set(user);
  console.log('User inserted into database:', user.id);
  return user;
};

export const setUserUsername = async (id: string, username: string) => {
  const usersRef = db.collection('users');
  const user = usersRef.doc(id);
  if ((await usersRef.where('username', '==', username).get()).docs[0]) {
    throw new Error('Username taken. Please try another.');
  } else {
    await user.update({ username });
  }
};

export const setUserMusicPlatform = async (
  id: string,
  musicPlatform: string,
  platformAuthCode: string
) => {
  if (!id) throw new Error('No user provided.');
  if (!musicPlatform) throw new Error('No music platform preference provided.');
  const usersRef = db.collection('users');
  const user = usersRef.doc(id);
  // spotify
  if (musicPlatform === MusicPlatform.spotify) {
    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', platformAuthCode);
    body.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URL || '');

    const res = await fetch('https://accounts.spotify.com/api/token', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Baseic ' + SPOTIFY_AUTH,
      },
      method: 'post',
      body,
    });
    if (res.status !== 200) {
      functions.logger.error(res.status, await res.text());
    } else {
      const spotifyAuthRes: SpotifyAuthRes = await res.json();
      const musicPlatformAuth = {
        expires_at: new Date(Date.now() + spotifyAuthRes.expires_in * 1000),
        access_token: spotifyAuthRes.access_token,
        refresh_token: spotifyAuthRes.refresh_token,
      };
      await user.update({
        musicPlatform,
        musicPlatformAuth,
      });
    }
  } else {
    // apple music
    await user.update({ musicPlatform });
  }
};

export const getUserSubmission = async (id: string) => {
  if (!id) throw new Error('No user provided.');
  const userRef = db.collection('users').doc(id);
  const currentSubmissionCount = (
    await db.collection('misc').doc('notifications').get()
  ).get('count');
  const submission = await userRef
    .collection('submissions')
    .where('number', '==', currentSubmissionCount)
    .get();
  if (!submission.docs[0]) return;
  const submissionData = submission.docs[0].data() as Submission;
  const username = (await userRef.get()).get('username');
  const musicPlatform = (await userRef.get()).get('musicPlatform');
  submissionData.time = new Timestamp(
    (submissionData.time as Timestamp).seconds,
    (submissionData.time as Timestamp).nanoseconds
  ).toDate();
  return { ...submissionData, user: { username, musicPlatform } };
};

export const generateUserSubmission = async (
  id: string,
  latitude: number = 0,
  longitude: number = 0
) => {
  if (!id) throw new Error('No user provided.');
  const userRef = db.collection('users').doc(id);
  const submissionsRef = userRef.collection('submissions');
  const currentSubmissionCount = (
    await db.collection('misc').doc('notifications').get()
  ).get('count');
  const accessCode = await checkSpotifyAccessCode(
    (await userRef.get()).get('musicPlatformAuth'),
    userRef
  );

  const currentSong = await getCurrentSpotifySong(accessCode);

  const song: Song = {
    name: currentSong.item.name,
    artist: currentSong.item.artists[0]?.name,
    url: currentSong.item.external_urls.spotify,
    durationElapsed: currentSong.progress_ms / 1000,
  };
  const time = Timestamp.fromDate(new Date());
  const submission: Submission = {
    time,
    number: currentSubmissionCount,
    audial: '',
    song,
    location: { latitude, longitude },
  };
  await submissionsRef.add(submission);
  const username = (await userRef.get()).get('username');
  const musicPlatform = (await userRef.get()).get('musicPlatform');
  submission.time = new Timestamp(
    (submission.time as Timestamp).seconds,
    (submission.time as Timestamp).nanoseconds
  ).toDate();
  return { ...submission, user: { username, musicPlatform } };
};

export const getFriendSubmissions = async (id: string) => {
  if (!id) throw new Error('No user provided.');
  const currentSubmissionCount = (
    await db.collection('misc').doc('notifications').get()
  ).get('count');
  const userRef = db.collection('users').doc(id);
  const friendIds = (await userRef.get()).get('friends');
  const friendSubmissions: Submission[] = [];
  for (const fId of friendIds) {
    const friendRef = db.collection('users').doc(fId);
    const friendSubmission = await friendRef
      .collection('submissions')
      .where('number', '==', currentSubmissionCount)
      .get();
    const username = (await friendRef.get()).get('username');
    const musicPlatform = (await friendRef.get()).get('musicPlatform');
    if (!friendSubmission.empty)
      friendSubmissions.push({
        ...(friendSubmission.docs[0].data() as Submission),
        user: { username, musicPlatform },
      });
  }

  return friendSubmissions;
};
