import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Audial, Song, Submission, User } from '../../types';
import { checkSpotifyAccessCode, getCurrentSpotifySong } from '../spotify';
import { sendNotificationToFriends } from './friends';

const db = getFirestore();

export const getUserSubmission: (
  user: User
) => Promise<Submission | undefined> = async (user) => {
  if (!user) throw new Error('No user provided.');
  const userRef = db.collection('users').doc(user.id);
  const currentSubmissionCount = (
    await db.collection('misc').doc('notifications').get()
  ).get('count');
  const submission = await userRef
    .collection('submissions')
    .where('number', '==', currentSubmissionCount)
    .get();
  if (!submission.docs[0]) return;
  const submissionData = submission.docs[0].data() as Submission;
  const username = user.username;
  const musicPlatform = user.musicPlatform;
  submissionData.time = (submissionData.time as Timestamp).toDate();
  submissionData.lateTime = (submissionData.lateTime as Timestamp).toDate();
  return {
    ...submissionData,
    user: { username, musicPlatform, id: user.id },
  } as Submission;
};

export const generateUserSubmission: (
  id: string,
  latitude: number,
  longitude: number
) => Promise<Submission> = async (id, latitude = 0, longitude = 0) => {
  if (!id) throw new Error('No user provided.');
  const userRef = db.collection('users').doc(id);
  const user = await userRef.get();

  // perform verification checks for this new submission
  const notificationsRef = await db
    .collection('misc')
    .doc('notifications')
    .get();
  const currentSubmissionCount = notificationsRef.get('count');
  const submissionsRef = userRef.collection('submissions');
  const existingSubmission = await submissionsRef
    .where('number', '==', currentSubmissionCount)
    .get();
  if (!existingSubmission.empty) throw new Error('User already submitted.');

  // get the most recently listend to song for this user
  const accessCode = await checkSpotifyAccessCode(
    user.get('musicPlatformAuth'),
    userRef
  );
  const currentSong = await getCurrentSpotifySong(accessCode);
  const song: Song = {
    id: '',
    name: currentSong.item.name,
    artist: currentSong.item.artists[0]?.name,
    url: currentSong.item.external_urls.spotify,
    length: currentSong.item.duration_ms / 1000,
    durationElapsed: currentSong.progress_ms / 1000,
    timestamp: currentSong.timestamp || 0,
  };

  // check for a late submission
  const notificationTimestamp = notificationsRef.get('time') as Timestamp;
  const notificationTime = notificationTimestamp.toDate();
  let late = false;
  let lateTime: Date | Timestamp = new Date();
  if (notificationTime > new Date()) {
    // the current date is before the current notification time, so we use the previous time.
    const prevTime = (notificationsRef.get('prevTime') as Timestamp).toDate();
    const difference = new Date().getTime() - prevTime.getTime(); // This will give difference in milliseconds
    const resultInMinutes = Math.round(difference / (60 * 1000));
    if (resultInMinutes > 2) {
      late = true;
      lateTime = new Date(new Date().getTime() - prevTime.getTime());
    }
  } else {
    // the current date is after the current notification time
    const difference = new Date().getTime() - notificationTime.getTime(); // This will give difference in milliseconds
    const resultInMinutes = Math.round(difference / (60 * 1000));
    if (resultInMinutes > 2) {
      late = true;
      lateTime = new Date(new Date().getTime() - notificationTime.getTime());
    }
  }

  // create and store the submission
  let time = Timestamp.fromDate(new Date());
  lateTime = Timestamp.fromDate(lateTime);
  const submission: Submission = {
    time,
    late,
    lateTime,
    number: currentSubmissionCount,
    audial: { number: -1, score: '' },
    song,
    location: { latitude, longitude },
  };
  await submissionsRef.add(submission);
  const username = user.get('username');
  const musicPlatform = user.get('musicPlatform');

  // send notification on late submission
  if (late)
    sendNotificationToFriends(
      user.data() as User,
      'late submission',
      `${username} just shared what they're listening to.`
    );

  // adjust time and lateTime for a frontend-readable format
  submission.time = time.toDate();
  submission.lateTime = lateTime.toDate();
  return { ...submission, user: { username, musicPlatform, id } };
};

export const getFriendSubmissions: (
  user: User
) => Promise<Submission[]> = async (user) => {
  if (!user) throw new Error('No user provided.');
  const currentSubmissionCount = (
    await db.collection('misc').doc('notifications').get()
  ).get('count');
  const friendSubmissions: Submission[] = [];
  for (const friend of user.friends) {
    const friendRef = db.collection('users').doc(friend.id);
    const friendSubmission = await friendRef
      .collection('submissions')
      .where('number', '==', currentSubmissionCount)
      .get();
    const musicPlatform = (await friendRef.get()).get('musicPlatform');
    if (!friendSubmission.empty) {
      const friendSub = friendSubmission.docs[0].data() as Submission;
      friendSub.time = (friendSub.time as Timestamp).toDate();
      friendSub.lateTime = (friendSub.lateTime as Timestamp).toDate();
      friendSubmissions.push({
        ...friendSub,
        user: { username: friend.username, musicPlatform, id: friend.id },
      });
    }
  }

  return friendSubmissions;
};

export const setUserCurrentSubmissionAudialScore = async (
  id: string,
  audial: Audial
) => {
  if (!id) throw new Error('No user provided.');
  if (!audial || !audial.score || !audial.number)
    throw new Error('Invalid audial provided');
  const userRef = db.collection('users').doc(id);
  const currentSubmissionCount = (
    await db.collection('misc').doc('notifications').get()
  ).get('count');
  const submissionRef = await userRef
    .collection('submissions')
    .where('number', '==', currentSubmissionCount)
    .get();
  if (submissionRef.empty) throw new Error('No current submission.');
  submissionRef.docs[0].ref.update({ audial: audial });
};
