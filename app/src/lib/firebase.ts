import { initializeApp } from 'firebase/app';
import {
  QuerySnapshot,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  PUBLIC_FIREBASE_API_KEY,
  PUBLIC_FIREBASE_AUTH_DOMAIN,
  PUBLIC_FIREBASE_DB_URL,
  PUBLIC_FIREBASE_MEASUREMENT_ID,
  PUBLIC_FIREBASE_MESSAGING_ID,
  PUBLIC_FIREBASE_PROJECT_ID,
  PUBLIC_FIREBASE_STORAGE_BUCKET,
  PUBLIC_FIREBASE_APP_ID,
} from '$env/static/public';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { browser } from '$app/environment';
import { session } from './session';
import { get } from 'svelte/store';
import { currSubNumber, submissionLoaded } from './util';
import { friendSubmissions, userSubmission } from './submission';
import {
  MusicPlatform,
  type SavedSong,
  type Submission,
  type User,
} from './types';

export const config = {
  apiKey: PUBLIC_FIREBASE_API_KEY,
  authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: PUBLIC_FIREBASE_DB_URL,
  projectId: PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: PUBLIC_FIREBASE_MESSAGING_ID,
  appId: PUBLIC_FIREBASE_APP_ID,
  measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(config);
export const db = getFirestore(app);

let emulatorsEmulated = false;

if (browser) {
  if (import.meta.env.DEV && !emulatorsEmulated) {
    try {
      FirebaseAuthentication.useEmulator({
        host: 'http://127.0.0.1',
        port: 9099,
      });
      connectFirestoreEmulator(db, '127.0.0.1', 5002);
      emulatorsEmulated = true;
    } catch {}
  }
}

export const submissionsCollection = collection(db, 'submissions');

const snapshots = {} as {
  user: Unsubscribe;
  misc: Unsubscribe;
  userSubmission?: Unsubscribe;
  friendSubmissions?: Unsubscribe;
};

export const setupSnapshots = async () => {
  if (!get(session).loggedIn) return;
  // snapshot user
  snapshots.user = onSnapshot(
    doc(db, 'users', get(session).user.id),
    async (document) => {
      // get public values
      const publicData = await getDoc(
        doc(db, 'users', get(session).user.id, 'public', 'info')
      );
      let songs: QuerySnapshot<DocumentData, DocumentData> | [];
      try {
        songs = await getDocs(
          collection(db, 'users', get(session).user.id, 'songs')
        );
      } catch {
        songs = [];
      }
      // set user values
      session.update((s) => {
        s.user.public.username = publicData.get('username');
        s.user.public.musicPlatform = publicData.get('musicPlatform');
        s.user.friends = document.get('friends');
        s.user.friendRequests = document.get('friendRequests');
        s.user.public.profile = publicData.get('profile');
        s.user.public.savedSongs = publicData.get('savedSongs');
        s.user.messagingToken = document.get('messagingToken');
        s.user.likedSongsPlaylist = document.get('likedSongsPlaylist');
        s.user.submissionsPlaylist = document.get('submissionsPlaylist');
        s.songs = [];
        songs.forEach((doc) => {
          s.songs.push(doc.data() as SavedSong);
        });
        return s;
      });
    }
  );
  // snapshot current submission number after getting it
  currSubNumber.set(
    (await getDoc(doc(db, 'misc/notifications'))).data()?.count
  );
  snapshots.misc = onSnapshot(doc(db, 'misc', 'notifications'), (doc) => {
    currSubNumber.set(doc.data()?.count);
  });
  // snapshot user submission status
  const qUserSub = query(
    submissionsCollection,
    where('userId', '==', get(session).user.id),
    where('number', '==', get(currSubNumber))
  );
  // request the document once first
  const subRef = await getDocs(qUserSub);
  if (subRef.docs[0]?.exists()) {
    userSubmission.set({
      ...(subRef.docs[0].data() as Submission),
      id: subRef.docs[0].id,
      user: {
        id: get(session).user.id,
        username: get(session).user.public.username || '',
        musicPlatform:
          get(session).user.public.musicPlatform || MusicPlatform.spotify,
      },
    });
  } else {
    // user submission doesn't exist
  }
  submissionLoaded.set(true);
  snapshots.userSubmission = onSnapshot(qUserSub, async (doc) => {
    if (doc.docs[0]?.exists()) {
      userSubmission.set({
        ...(doc.docs[0].data() as Submission),
        id: doc.docs[0].id,
        user: {
          id: get(session).user.id,
          username: get(session).user.public.username || '',
          musicPlatform:
            get(session).user.public.musicPlatform || MusicPlatform.spotify,
        },
      });
    } else {
      // user submission doesn't exist
    }
  });
  // snapshot friend submissions
  const friendIds = get(session).user.friends.map((f) => f.id);

  if (friendIds.length === 0) return;
  const qFriendSubs = query(
    submissionsCollection,
    where('userId', 'in', friendIds),
    where('number', '==', get(currSubNumber))
  );

  // request the documents once first
  (await getDocs(qFriendSubs)).forEach(async (d) => {
    const publicUser = (
      await getDoc(doc(db, 'users', d.get('userId'), 'public', 'info'))
    ).data() as User['public'];
    const fSub = {
      ...d.data(),
      id: d.id,
      user: {
        id: d.get('userId'),
        username: publicUser.username,
        musicPlatform: publicUser.musicPlatform,
      },
    } as Submission;

    friendSubmissions.update((fs) => {
      // remove existing submission instance
      fs = fs.filter((s) => s.id !== fSub.id);
      // add updated submission instance
      fs = [...fs, fSub];
      // complete update
      return fs;
    });
  });

  snapshots.friendSubmissions = onSnapshot(qFriendSubs, async (docs) => {
    docs.forEach(async (d) => {
      const publicUser = (
        await getDoc(doc(db, 'users', d.get('userId'), 'public', 'info'))
      ).data() as User['public'];
      const fSub = {
        ...d.data(),
        id: d.id,
        user: {
          id: d.get('userId'),
          username: publicUser.username,
          musicPlatform: publicUser.musicPlatform,
        },
      } as Submission;

      friendSubmissions.update((fs) => {
        // remove existing submission instance
        fs = fs.filter((s) => s.id !== fSub.id);
        // add updated submission instance
        fs = [...fs, fSub];
        // complete update
        return fs;
      });
    });
  });
};

export const unsubscribeSnapshots = () => {
  snapshots.user();
  snapshots.misc();
  if (snapshots.userSubmission) snapshots.userSubmission();
  if (snapshots.friendSubmissions) snapshots.friendSubmissions();
};
