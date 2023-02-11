import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Audial, Submission, User, Song } from '../types';
import { randomUUID } from 'crypto';

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
    throw Error(`Email '${user.email}' already registered.`);
  }

  if ((await usersRef.doc(user.id).get()).exists) {
    console.log(
      'uid taken',
      user.id,
      (await usersRef.doc(user.id).get()).exists
    );
    throw Error('User ID taken. (Perhaps the user has already registered.)');
  }

  const newUserRef = db.collection('users').doc(user.id);
  user.friends = [];
  user.savedSongs = [];
  user.submissions = [];
  user.audials = [];
  await newUserRef.set(user);
  console.log('User inserted into database:', user.id);
  return user;
};

export const setUserUsername = async (id: string, username: string) => {
  const usersRef = db.collection('users');
  const user = usersRef.doc(id);
  if ((await usersRef.where('username', '==', username).get()).docs[0]) {
    throw Error('Username taken. Please try another.');
  } else {
    await user.update({ username });
  }
};

export const setUserMusicPreference = async (
  id: string,
  musicPreference: string
) => {
  const usersRef = db.collection('users');
  const user = usersRef.doc(id);
  await user.update({ musicPreference });
};

export const createSubmission = async (submission: Submission) => {
  submission.time = Timestamp.fromDate(submission.time as Date);
  const id = randomUUID();
  const newSubmissionRef = db.collection('submissions').doc(id);
  await newSubmissionRef.set(submission);
  console.log('Submission inserted into database:', id);
  return id;
};

export const createAudial = async (audial: Audial) => {
  const id = randomUUID();
  const newAudialRef = db.collection('audials').doc(id);
  await newAudialRef.set(audial);
  console.log('Audial inserted into database:', id);
  return id;
};

export const createSong = async (song: Song) => {
  const id = randomUUID();
  const newAudialRef = db.collection('audials').doc(id);
  await newAudialRef.set(song);
  console.log('Song inserted into database:', id);
  return id;
};
