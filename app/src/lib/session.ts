import type { SavedSong, Submission, User } from './types';
import { get, writable, type Writable } from 'svelte/store';
import Preferences from './preferences';
import {
  FirebaseAuthentication,
  type AuthStateChange,
  type SignInResult,
} from '@capacitor-firebase/authentication';
import { unsubscribeSnapshots } from './firebase';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import { getUserStatistics } from './user';
import { goto } from '$app/navigation';

export type Session = {
  user: User;
  loggedIn: boolean;
  songs: SavedSong[];
  friendSubmissions: Submission[];
  loaded: boolean;
};

export const session = <Writable<Session>>writable({} as Session);

export const loadSession = async () => {
  const sesh = {
    user: await Preferences.getUser(),
    loggedIn: await Preferences.getLogin(),
    songs: await Preferences.getSongs(),
    friendSubmissions: await Preferences.getFriendSubmissions(),
    loaded: true,
  };
  // handle old saved user information from preferences
  sesh.user.public = {} as User['public'];
  session.set(sesh);
};

export const saveSession = async () => {
  const sesh = get(session);
  await Preferences.setUser(sesh.user);
  await Preferences.setLogin(sesh.loggedIn);
  await Preferences.setSongs(sesh.songs);
  await Preferences.setFriendSubmissions(sesh.friendSubmissions);
};

export const endSession = async () => {
  unsubscribeSnapshots();
  await FirebaseAuthentication.signOut();
  await Preferences.setUser();
  await Preferences.setLogin();
  await Preferences.setSongs();
  await Preferences.setFriendSubmissions();
  session.set({} as Session);
};

export const authSession = async (
  authStateUser: AuthStateChange['user'],
  signInUser?: SignInResult['user']
) => {
  // auth failed
  if (!authStateUser && !signInUser) return;
  // update the session

  const loginData = signInUser ? signInUser : authStateUser;
  if (!loginData) return;
  let u = {
    id: loginData.uid,
    email: loginData.email,
    friends: [],
    friendRequests: [],
    public: {
      username: '',
      profile: {
        stats: {
          submissionCount: 0,
          onTimeSubmissionCount: 0,
        },
      },
    },
  } as User;
  const dbUser = await FirebaseFirestore.getDocument({
    reference: `users/${u.id}`,
  });

  session.update((s) => {
    return { ...s, loggedIn: true, user: u, loaded: true };
  });

  if (dbUser.snapshot.data) {
    // get public data
    const res = await FirebaseFirestore.getDocument({
      reference: `users/${u.id}/public/info`,
    });
    const publicData = res.snapshot.data as User['public'];

    if (!publicData.username) {
      return goto('/intro/username');
    }
    if (!publicData.musicPlatform) {
      return goto('/intro/music-platform');
    }

    // load user statistics into the session
    const stats = await getUserStatistics(u.id, publicData.username);
    // save stats to public data
    if (publicData.profile) publicData.profile.stats = stats;
    else publicData.profile = { stats } as User['public']['profile'];
    u = {
      ...(dbUser.snapshot.data as User),
      id: dbUser.snapshot.id,
      email: u.email,
      public: publicData,
    };
  } else {
    await FirebaseFirestore.setDocument({
      reference: `users/${u.id}`,
      data: u,
    });
    goto('/intro/username');
  }

  session.update((s) => {
    return { ...s, loggedIn: true, user: u, loaded: true };
  });
  saveSession();
};
