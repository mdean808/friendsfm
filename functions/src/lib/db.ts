import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  Submission,
  User,
  Song,
  MusicPlatform,
  SpotifyAuthRes,
  Friend,
} from '../types';
import * as functions from 'firebase-functions';
import { checkSpotifyAccessCode, getCurrentSpotifySong } from './spotify';

const SPOTIFY_AUTH = Buffer.from(
  process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
).toString('base64');
const db = getFirestore();

export const getUserById = async (uid: string) => {
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
    throw new Error(
      'User ID taken. (Perhaps the user has already registered.)'
    );
  }

  const newUserRef = db.collection('users').doc(user.id);
  user.friends = [];
  user.username = user.id;
  user.friendRequests = [];
  await newUserRef.set(user);
  functions.logger.info('User inserted into database:', user.id);
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
        Authorization: 'Basic ' + SPOTIFY_AUTH,
      },
      method: 'post',
      body,
    });
    if (res.status !== 200) {
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
  const notificationsRef = await db
    .collection('misc')
    .doc('notifications')
    .get();
  const currentSubmissionCount = notificationsRef.get('count');
  //TODO: check if there is already a submission with this count in the user's submissions
  const notificationTimestamp = notificationsRef.get('time');
  const accessCode = await checkSpotifyAccessCode(
    (await userRef.get()).get('musicPlatformAuth'),
    userRef
  );

  const currentSong = await getCurrentSpotifySong(accessCode);

  const song: Song = {
    name: currentSong.item.name,
    artist: currentSong.item.artists[0]?.name,
    url: currentSong.item.external_urls.spotify,
    length: currentSong.item.duration_ms / 1000,
    durationElapsed: currentSong.progress_ms / 1000,
    timestamp: currentSong.timestamp || undefined,
  };
  let late = false;
  // check for a late submission
  const notificationTime = new Timestamp(
    (notificationTimestamp as Timestamp).seconds,
    (notificationTimestamp as Timestamp).nanoseconds
  ).toDate();
  var startTime = notificationTime;
  var endTime = new Date();
  var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
  var resultInMinutes = Math.round(difference / 60000);

  if (resultInMinutes > 2) {
    late = true;
  }
  const time = Timestamp.fromDate(new Date());
  const submission: Submission = {
    time,
    late,
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
  const friends = (await userRef.get()).get('friends') as Friend[];
  const friendSubmissions: Submission[] = [];
  for (const friend of friends) {
    const friendRef = db.collection('users').doc(friend.id);
    const friendSubmission = await friendRef
      .collection('submissions')
      .where('number', '==', currentSubmissionCount)
      .get();
    const musicPlatform = (await friendRef.get()).get('musicPlatform');
    if (!friendSubmission.empty) {
      const friendSub = friendSubmission.docs[0].data() as Submission;
      friendSub.time = new Timestamp(
        (friendSub.time as Timestamp).seconds,
        (friendSub.time as Timestamp).nanoseconds
      ).toDate();
      friendSubmissions.push({
        ...friendSub,
        user: { username: friend.username, musicPlatform },
      });
    }
  }

  return friendSubmissions;
};

export const acceptFriendRequest = async (
  user: User,
  requestUsername: string
) => {
  if (!requestUsername) throw new Error('No requester provided');
  const usersRef = db.collection('users');
  const friendQuery = usersRef.where('username', '==', requestUsername);
  const friend = (await friendQuery.get()).docs[0].data() as User;
  // if we have such a friend and there is an actual request from them to the user
  if (friend && user.friendRequests.find((u) => u === friend.username)) {
    // update user friends
    const userFriends = user.friends;
    userFriends.push({ username: friend.username, id: friend.uid });
    const userRef = usersRef.doc(user.uid);
    await userRef.update({ friends: userFriends });
    // remove from friend request array
    const userFriendRequests = user.friendRequests;
    const updatedRequests = userFriendRequests.filter(
      (u) => u !== friend.username
    );
    await userRef.update({ friendRequests: updatedRequests });

    // update friend friends
    const friendFriends = friend.friends;
    friendFriends.push({ username: friend.username, id: user.uid });
    const friendRef = usersRef.doc(friend.uid);
    await friendRef.update({ friends: friendFriends });
    return (await userRef.get()).data() as User;
  } else {
    throw new Error('Friend request does not exist.');
  }
};

export const sendFriendRequest = async (user: User, friendUsername: string) => {
  if (!friendUsername) throw new Error('No username provided');

  const usersRef = db.collection('users');
  const friendQuery = usersRef.where('username', '==', friendUsername);
  const friend = (await friendQuery.get()).docs[0].data() as User;
  if (friend) {
    const friendRef = usersRef.doc(friend.id);
    const requests = [...friend.friendRequests, user.username];
    await friendRef.update({ friendRequests: requests });
  } else {
    throw new Error('No user with provided username.');
  }
};
