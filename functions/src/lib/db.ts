import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Submission, User, Song, MusicPlatform } from '../types';

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
  platformAccessToken: string
) => {
  if (!id) throw new Error('No user provided.');
  if (!musicPlatform) throw new Error('No music platform preference provided.');
  const usersRef = db.collection('users');
  const user = usersRef.doc(id);
  // spotify
  console.log(musicPlatform);
  if (musicPlatform === MusicPlatform.spotify) {
    const params = new URLSearchParams();
    params.append('client_id', process.env.SPOTIFY_CLIENT_ID || '');
    params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET || '');
    params.append('grant_type', 'authorization_code');
    params.append('code', platformAccessToken);
    params.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URL || '');

    const res = await fetch(
      'https://accounts.spotify.com/api/token?' + params.toString(),
      {
        method: 'post',
      }
    );
    const musicPlatformAuth = await res.json();
    console.log(musicPlatformAuth);
    await user.update({
      musicPlatform,
      musicPlatformAuth,
    });
  }

  // apple music
  await user.update({ musicPlatform });
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
  //TODO: get song info from the music provider
  const song: Song = {
    name: 'Personal Jesus - 2006 Remaster',
    artist: 'Depeche Mode',
    url: 'https://open.spotify.com/track/7dhM0KUBxuZV9z5iNodLyn?si=9e70b4c13dda4394',
    durationElapsed: 21,
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
