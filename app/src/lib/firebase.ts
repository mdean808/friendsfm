import { initializeApp } from 'firebase/app';

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
import {
  FirebaseFirestore,
  type DocumentData,
  type DocumentSnapshot,
} from '@capacitor-firebase/firestore';
import { browser } from '$app/environment';
import { session } from './session';
import { get } from 'svelte/store';
import { chunkArray, currSubNumber, loadingFriendSubmissions } from './util';
import {
  activeSubmission,
  friendSubmissions,
  loadUserSubmission,
  updateSubmissions,
  userSubmission,
} from './submission';
import {
  MusicPlatform,
  type SavedSong,
  type Submission,
  type User,
} from './types/friendsfm';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { loadUser, migratePublicInfo } from './user';
import { friendSubmissionsFilter, userSubmissionFilter } from './filters';

// INIT FIREBASE

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
export const db = getFirestore();

let emulatorsEmulated = false;

if (browser) {
  if (import.meta.env.DEV && !emulatorsEmulated) {
    try {
      // noinspection JSIgnoredPromiseFromCall
      FirebaseAuthentication.useEmulator({
        host: 'http://127.0.0.1',
        port: 9099,
      });
      connectFirestoreEmulator(db, '127.0.0.1', 5002);
      emulatorsEmulated = true;
    } catch { }
  }
}

// INIT SNAPSHOTS

const snapshots = { friendSubmissions: [] } as {
  user?: string;
  misc?: string;
  userSubmission?: string;
  friendSubmissions: string[];
};

export const setupSnapshots = async () => {
  if (!get(session).loggedIn) return;
  const user = await loadUser(get(session).user.id);

  if (!user.public) {
    await migratePublicInfo();
  }

  let songs: DocumentSnapshot<DocumentData>[] | [];
  try {
    const res = await FirebaseFirestore.getCollection({
      reference: `users/${get(session).user.id}/songs`,
    });
    songs = res.snapshots;
  } catch {
    songs = [];
  }
  // set user values
  session.update((s) => {
    s.user.public.username = user.public?.username;
    s.user.public.musicPlatform = user.public?.musicPlatform;
    s.user.friends = user.friends;
    s.user.friendRequests = user.friendRequests;
    s.user.public.profile = user.public?.profile;
    s.user.public.savedSongs = user.public?.savedSongs;
    s.user.messagingToken = user.messagingToken;
    s.user.likedSongsPlaylist = user.likedSongsPlaylist;
    s.user.submissionsPlaylist = user.submissionsPlaylist;
    s.songs = [];
    songs.forEach((snap) => {
      s.songs.push(snap.data as SavedSong);
    });
    return s;
  });

  // snapshot on user
  snapshots.user = await FirebaseFirestore.addDocumentSnapshotListener(
    { reference: `users/${get(session).user.id}` },
    async (event, err) => {
      if (err)
        return console.log(
          `Snapshot reference 'users/${get(session).user.id}' error:`,
          err
        );
      const doc = { ...event?.snapshot.data, id: event?.snapshot.id } as User;
      const res = await FirebaseFirestore.getDocument({
        reference: `users/${get(session).user.id}/public/info`,
      });
      const publicData = res.snapshot.data;
      let songs: DocumentSnapshot<DocumentData>[] | [];
      try {
        const res = await FirebaseFirestore.getCollection({
          reference: `users/${get(session).user.id}/songs`,
        });
        songs = res.snapshots;
      } catch {
        songs = [];
      }
      // set user values
      session.update((s) => {
        s.user.public.username = publicData?.username;
        s.user.public.musicPlatform = publicData?.musicPlatform;
        s.user.friends = doc.friends;
        s.user.friendRequests = doc.friendRequests;
        s.user.public.profile = publicData?.profile;
        s.user.public.savedSongs = publicData?.savedSongs;
        s.user.messagingToken = doc.messagingToken;
        s.user.likedSongsPlaylist = doc.likedSongsPlaylist;
        s.user.submissionsPlaylist = doc.submissionsPlaylist;
        s.songs = [];
        songs.forEach((snap) => {
          s.songs.push(snap.data as SavedSong);
        });
        return s;
      });
    }
  );

  // get current submission number
  const miscSnapshot = await FirebaseFirestore.getDocument({
    reference: 'misc/notifications',
  });
  currSubNumber.set(miscSnapshot.snapshot.data?.count);
  // snapshot current submission number
  snapshots.misc = await FirebaseFirestore.addDocumentSnapshotListener(
    { reference: 'misc/notifications' },
    async (event, err) => {
      if (err)
        return console.log(
          'Snapshot reference `misc/notifications` error:',
          err
        );
      const num = event?.snapshot.data?.count;
      if (num > get(currSubNumber)) {
        currSubNumber.set(event?.snapshot.data?.count);
        friendSubmissions.set([]);
        userSubmission.set(null);
      }
    }
  );

  // load user submission
  await loadUserSubmission();

  // snapshot user sub
  snapshots.userSubmission =
    await FirebaseFirestore.addCollectionSnapshotListener(
      { reference: 'submissions', compositeFilter: userSubmissionFilter() },
      async (event, err) => {
        if (err)
          return console.log('Snapshot reference `submissions` error:', err);
        if (event?.snapshots[0]) {
          userSubmission.set({
            ...(event.snapshots[0].data as Submission),
            id: event.snapshots[0].id,
            time: new Date(event.snapshots[0].data?.time),
            lateTime: new Date(event.snapshots[0].data?.lateTime),
            user: {
              id: get(session).user.id,
              username: get(session).user.public.username || '',
              musicPlatform:
                get(session).user.public.musicPlatform || MusicPlatform.spotify,
            },
          });
          // update activeSubmission if needed
          if (get(activeSubmission)?.id === event?.snapshots[0].id)
            activeSubmission.set(get(userSubmission));
        } else {
          // user submission doesn't exist
          userSubmission.set(null);
        }
      }
    );

  // friend submissions
  const friendIds = get(session).user.friends.map((f) => f.id);

  if (friendIds.length === 0) return;

  const friendIdChunks = chunkArray(friendIds, 30);

  for (const chunk of friendIdChunks) {
    // Load friend submissions
    const docs = await FirebaseFirestore.getCollection({
      reference: 'submissions',
      compositeFilter: friendSubmissionsFilter(chunk),
    });
    // reset friend submissions before new ones
    friendSubmissions.set([]);
    await updateSubmissions(docs.snapshots);
    loadingFriendSubmissions.set(false);

    // Snapshot friend submissions
    snapshots.friendSubmissions.push(
      await FirebaseFirestore.addCollectionSnapshotListener(
        {
          reference: 'submissions',
          compositeFilter: friendSubmissionsFilter(chunk),
        },
        async (event, err) => {
          if (err)
            return console.log(
              'Snapshot reference `friendSubmissions` error:',
              err
            );
          if (!event) return;
          const subs = await updateSubmissions(event?.snapshots);
          // update active submission if we need to
          subs.forEach((sub) => {
            if (get(activeSubmission)?.id === sub.id) activeSubmission.set(sub);
          });
        }
      )
    );
  }
};

export const unsubscribeSnapshots = async () => {
  if (snapshots.user)
    await FirebaseFirestore.removeSnapshotListener({
      callbackId: snapshots.user,
    });
  if (snapshots.misc)
    await FirebaseFirestore.removeSnapshotListener({
      callbackId: snapshots.misc,
    });
  if (snapshots.userSubmission)
    await FirebaseFirestore.removeSnapshotListener({
      callbackId: snapshots.userSubmission,
    });
  for (const snapId in snapshots.friendSubmissions)
    await FirebaseFirestore.removeSnapshotListener({ callbackId: snapId });
};
