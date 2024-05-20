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
  type QueryCompositeFilterConstraint,
} from '@capacitor-firebase/firestore';
import { browser } from '$app/environment';
import { session } from './session';
import { get } from 'svelte/store';
import { chunkArray, currSubNumber, submissionLoaded } from './util';
import {
  activeSubmission,
  friendSubmissions,
  userSubmission,
} from './submission';
import {
  MusicPlatform,
  type SavedSong,
  type Submission,
  type User,
} from './types';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { migratePublicInfo } from './user';

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
      FirebaseAuthentication.useEmulator({
        host: 'http://127.0.0.1',
        port: 9099,
      });
      connectFirestoreEmulator(db, '127.0.0.1', 5002);
      emulatorsEmulated = true;
    } catch {}
  }
}

const snapshots = { friendSubmissions: [] } as {
  user?: string;
  misc?: string;
  userSubmission?: string;
  friendSubmissions: string[];
};

export const setupSnapshots = async () => {
  if (!get(session).loggedIn) return;
  // load user
  let res = await FirebaseFirestore.getDocument({
    reference: `users/${get(session).user.id}`,
  });
  const user = { ...res.snapshot.data, id: res.snapshot.id } as User;
  res = await FirebaseFirestore.getDocument({
    reference: `users/${get(session).user.id}/public/info`,
  });
  const publicData = res.snapshot.data as User['public'];

  if (!publicData) {
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
    s.user.public.username = publicData?.username;
    s.user.public.musicPlatform = publicData?.musicPlatform;
    s.user.friends = user.friends;
    s.user.friendRequests = user.friendRequests;
    s.user.public.profile = publicData?.profile;
    s.user.public.savedSongs = publicData?.savedSongs;
    s.user.messagingToken = user.messagingToken;
    s.user.likedSongsPlaylist = user.likedSongsPlaylist;
    s.user.submissionsPlaylist = user.submissionsPlaylist;
    s.songs = [];
    songs.forEach((snap) => {
      s.songs.push(snap.data as SavedSong);
    });
    return s;
  });
  // snapshot user

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

  // snapshot current submission number after getting it
  const miscSnapshot = await FirebaseFirestore.getDocument({
    reference: 'misc/notifications',
  });
  currSubNumber.set(miscSnapshot.snapshot.data?.count);
  snapshots.misc = await FirebaseFirestore.addDocumentSnapshotListener(
    { reference: 'misc/notifications' },
    async (event, err) => {
      if (err)
        return console.log(
          'Snapshot reference `misc/notifications` error:',
          err
        );
      currSubNumber.set(event?.snapshot.data?.count);
    }
  );

  // load user submission
  const userFilter: QueryCompositeFilterConstraint = {
    type: 'and',
    queryConstraints: [
      {
        type: 'where',
        fieldPath: 'userId',
        opStr: '==',
        value: get(session).user.id,
      },
      {
        type: 'where',
        fieldPath: 'number',
        opStr: '==',
        value: get(currSubNumber),
      },
    ],
  };
  // snapshot user submission status
  const colRes = await FirebaseFirestore.getCollection({
    reference: 'submissions',
    compositeFilter: userFilter,
  });
  const sub = colRes.snapshots[0];
  if (sub?.data) {
    userSubmission.set({
      ...(sub.data as Submission),
      id: sub.id,
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
  // snapshot user sub

  snapshots.userSubmission =
    await FirebaseFirestore.addCollectionSnapshotListener(
      { reference: 'submissions', compositeFilter: userFilter },
      async (event, err) => {
        if (err)
          return console.log('Snapshot reference `submissions` error:', err);
        if (event?.snapshots[0]) {
          userSubmission.set({
            ...(event.snapshots[0].data as Submission),
            id: event.snapshots[0].id,
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
        }
      }
    );

  // friend submissions
  const friendIds = get(session).user.friends.map((f) => f.id);

  if (friendIds.length === 0) return;

  const friendIdChunks = chunkArray(friendIds, 30);

  const updateSubmissions = async (docs: DocumentSnapshot<DocumentData>[]) => {
    docs.forEach(async (d) => {
      const res = await FirebaseFirestore.getDocument({
        reference: `users/${d.data?.userId}/public/info`,
      });
      const publicUser = res.snapshot.data as User['public'];
      const fSub = {
        ...d.data,
        id: d.id,
        user: {
          id: d.data?.userId,
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

      // update activeSubmission if needed
      if (get(activeSubmission)?.id === fSub.id) activeSubmission.set(fSub);
    });
  };

  friendIdChunks.forEach(async (chunk) => {
    const friendSubsFilter: QueryCompositeFilterConstraint = {
      type: 'and',
      queryConstraints: [
        {
          type: 'where',
          fieldPath: 'userId',
          opStr: 'in',
          value: chunk,
        },
        {
          type: 'where',
          fieldPath: 'number',
          opStr: '==',
          value: get(currSubNumber),
        },
      ],
    };

    // Load friend submissions
    const docs = await FirebaseFirestore.getCollection({
      reference: 'submissions',
      compositeFilter: friendSubsFilter,
    });
    await updateSubmissions(docs.snapshots); // /* ChatGPT CODE */

    // Snapshot friend submissions
    snapshots.friendSubmissions.push(
      await FirebaseFirestore.addCollectionSnapshotListener(
        { reference: 'submissions', compositeFilter: friendSubsFilter },
        async (event, err) => {
          if (err)
            return console.log('Snapshot reference `submissions` error:', err);
          if (!event) return;
          await updateSubmissions(event?.snapshots);
        }
      )
    );
  });
};

export const unsubscribeSnapshots = () => {
  if (snapshots.user)
    FirebaseFirestore.removeSnapshotListener({ callbackId: snapshots.user });
  if (snapshots.misc)
    FirebaseFirestore.removeSnapshotListener({ callbackId: snapshots.misc });
  if (snapshots.userSubmission)
    FirebaseFirestore.removeSnapshotListener({
      callbackId: snapshots.userSubmission,
    });
  for (const snapId in snapshots.friendSubmissions)
    FirebaseFirestore.removeSnapshotListener({ callbackId: snapId });
};
