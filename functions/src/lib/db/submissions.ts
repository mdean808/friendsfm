import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Friend, Song, Submission } from '../../types';
import { checkSpotifyAccessCode, getCurrentSpotifySong } from '../spotify';

const db = getFirestore();

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
    timestamp: currentSong.timestamp || 0,
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
