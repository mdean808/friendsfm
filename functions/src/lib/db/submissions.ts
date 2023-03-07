import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Audial, Song, Submission, User } from '../../types';
import { checkSpotifyAccessCode, getCurrentSpotifySong } from '../spotify';

const db = getFirestore();

export const getUserSubmission = async (user: User) => {
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
  submissionData.time = new Timestamp(
    (submissionData.time as Timestamp).seconds,
    (submissionData.time as Timestamp).nanoseconds
  ).toDate();
  submissionData.lateTime = new Timestamp(
    (submissionData.lateTime as Timestamp).seconds,
    (submissionData.lateTime as Timestamp).nanoseconds
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
  const notificationTimestamp = notificationsRef.get('time') as Timestamp;
  const accessCode = await checkSpotifyAccessCode(
    (await userRef.get()).get('musicPlatformAuth'),
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
  const username = (await userRef.get()).get('username');
  const musicPlatform = (await userRef.get()).get('musicPlatform');
  submission.time = new Timestamp(
    (submission.time as Timestamp).seconds,
    (submission.time as Timestamp).nanoseconds
  ).toDate();
  submission.lateTime = new Timestamp(
    (submission.lateTime as Timestamp).seconds,
    (submission.lateTime as Timestamp).nanoseconds
  ).toDate();
  return { ...submission, user: { username, musicPlatform } };
};

export const getFriendSubmissions = async (user: User) => {
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
      friendSub.time = new Timestamp(
        (friendSub.time as Timestamp).seconds,
        (friendSub.time as Timestamp).nanoseconds
      ).toDate();
      friendSub.lateTime = new Timestamp(
        (friendSub.lateTime as Timestamp).seconds,
        (friendSub.lateTime as Timestamp).nanoseconds
      ).toDate();
      friendSubmissions.push({
        ...friendSub,
        user: { username: friend.username, musicPlatform },
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
