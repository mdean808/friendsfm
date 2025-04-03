import { get, writable, type Writable } from 'svelte/store';
import type {
  MusicPlatform,
  SavedSong,
  Song,
  Submission,
  User,
  UserStatistics,
} from '$lib/types/friendsfm';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { network } from '$lib/util';
import { session } from '$lib/session';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';

export const spotifyAuthCode = <Writable<string>>writable();

export const loadUser = async (uid: string): Promise<User> => {
  // load user
  let res = await FirebaseFirestore.getDocument({
    reference: `users/${uid}`,
  });
  const user = { ...res.snapshot.data, id: res.snapshot.id } as User;
  // load public data
  res = await FirebaseFirestore.getDocument({
    reference: `users/${get(session).user.id}/public/info`,
  });
  user.public = res.snapshot.data as User['public'];
  return user;
};

export const refreshMessagingToken = async (token?: string) => {
  if (Capacitor.getPlatform() !== 'web' && !token) {
    await FirebaseMessaging.checkPermissions().catch(
      async () => await FirebaseMessaging.requestPermissions()
    );
    token = (await FirebaseMessaging.getToken())?.token;
  }
  // make sure to subscribe to the global topic
  await FirebaseMessaging.subscribeToTopic({ topic: 'all' });
  await FirebaseFirestore.updateDocument({
    reference: `users/${get(session).user.id}`,
    data: { messagingToken: token },
  });
  return token;
};

export const updateMusicPlatform = async (
  newMusicPlatform: MusicPlatform,
  authCode?: string,
  redirectUrl?: string
) => {
  const message = await network.queryFirebase('setmusicplatform', {
    musicPlatform: newMusicPlatform,
    platformAuthCode: authCode,
    redirectUrl,
  });
  if (!message) return;

  session.update((s) => {
    s.user.public.musicPlatform = newMusicPlatform;
    return s;
  });
  // update state
  FirebaseAnalytics.setUserProperty({
    key: 'musicPlatform',
    value: newMusicPlatform,
  });
  // musuc platform set succeeded!
  return true;
};

export const getCurrentSong = async (
  id?: string,
  username?: string
): Promise<Song | undefined> => {
  const message = await network.queryFirebase('getusercurrentlylistening', {
    id,
    username,
  });
  if (!message) return;
  return message;
};

export const updateUsername = async (newUsername: string) => {
  await FirebaseFirestore.updateDocument({
    reference: `users/${get(session).user.id}/public/info`,
    data: { username: newUsername },
  });

  // update state
  session.update((s) => {
    s.user.public.username = newUsername;
    return s;
  });
  FirebaseAnalytics.setUserProperty({ key: 'username', value: newUsername });
  // username setting succeeded!
  return true;
};

export const migratePublicInfo = async () => {
  const docRef = `users/${get(session).user.id}/public/info`;
  const { snapshot } = await FirebaseFirestore.getDocument({
    reference: docRef,
  });

  if (snapshot.data) {
    return snapshot.data as User['public'];
  }

  // create public info object
  const data = await FirebaseFirestore.getDocument({
    reference: `users/${get(session).user.id}`,
  });
  const publicInfo: User['public'] = {
    username: data.snapshot.data?.username,
    musicPlatform: data.snapshot.data?.musicPlatform,
    savedSongs: data.snapshot.data?.savedSongs,
    profile: data.snapshot.data?.profile,
  };

  // insert public info into the document
  await FirebaseFirestore.setDocument({
    reference: docRef,
    data: publicInfo,
  });

  return publicInfo;
};

export const getUserStatistics = async (id: string, username?: string) => {
  const stats = {} as UserStatistics;
  // get number of submissions user has made
  const submissionsRes = await FirebaseFirestore.getCollection({
    reference: 'submissions',
    compositeFilter: {
      type: 'and',
      queryConstraints: [
        {
          type: 'where',
          fieldPath: 'userId',
          opStr: '==',
          value: id,
        },
      ],
    },
  });
  stats.submissionCount = submissionsRes.snapshots.length;
  // calculate most commonly submitted song
  //   and calculate number of on time submissions
  stats.onTimeSubmissionCount = 0;
  const popularSongs = [] as (SavedSong & { appearances: number })[];
  submissionsRes.snapshots.forEach((doc) => {
    const sub = doc.data as Submission;
    if (!sub.late) stats.onTimeSubmissionCount++;
    // calculate popular song
    const songIndex = popularSongs.findIndex(
      (s) => s.name === sub.song.name && s.artist === sub.song.artist
    );
    if (songIndex === -1) {
      popularSongs.push({
        ...sub.song,
        appearances: 1,
        user: {
          id: id,
          username: username || 'unknown',
        },
      });
    } else {
      // get album artwork if some of the submissions are from old versions
      if (!popularSongs[songIndex]?.albumArtwork && sub?.song?.albumArtwork) {
        popularSongs[songIndex].albumArtwork = sub?.song?.albumArtwork;
      }
      popularSongs[songIndex].appearances++;
    }
  });
  stats.topSong = popularSongs.sort((a, b) => b.appearances - a.appearances)[0];
  return stats;
};

export const setProfile = async (profile: User['public']['profile']) => {
  await FirebaseFirestore.updateDocument({
    reference: `users/${get(session).user.id}/public/info`,
    data: { profile },
  });
};
