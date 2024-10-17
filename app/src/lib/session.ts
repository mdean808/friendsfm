import { type SavedSong, type Submission, type User } from './types/friendsfm';
import { get, writable, type Writable } from 'svelte/store';
import Preferences from './preferences';
import {
  FirebaseAuthentication,
  type AuthStateChange,
  type SignInResult,
} from '@capacitor-firebase/authentication';
import { unsubscribeSnapshots } from './firebase';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import { getUserStatistics, refreshMessagingToken } from './user';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { browser } from '$app/environment';
import { friendSubmissions } from './submission';
import { songs } from './songs';

export type Session = {
  user: User;
  loggedIn: boolean;
  songs: SavedSong[];
  friendSubmissions: Submission[];
  loaded: boolean;
};

export const session = <Writable<Session>>writable({} as Session);

if (browser) {
  session.subscribe(async (sesh) => {
    // handle routing overrides based on session state
    const currRoute = get(page).route?.id;
    switch (currRoute) {
      case '/intro/login':
        if (sesh.loaded && sesh.loggedIn) {
          if (sesh.user.public.username)
            if (sesh.user.public.musicPlatform) goto('/main/home');
            else goto('/intro/music-platform');
          else goto('/intro/username');
        }
        break;
      case '/intro/username':
        if (sesh.loaded && sesh.loggedIn) {
          if (sesh.user.public.username)
            if (sesh.user.public.musicPlatform) goto('/main/home');
            else goto('/intro/music-platform');
          else break;
        }
        break;
      case '/intro/music-platform':
        if (sesh.loaded && sesh.loggedIn) {
          if (sesh.user.public.username)
            if (sesh.user.public.musicPlatform) goto('/main/home');
            else break;
          else goto('/intro/username');
        }
        break;
      case '/':
        if (sesh.loaded && sesh.loggedIn) {
          if (sesh.user.public.username)
            if (sesh.user.public.musicPlatform) goto('/main/home');
            else goto('/intro/music-platform');
          else goto('/intro/username');
        } else goto('/intro/login');
        break;
      default:
        break;
    }
  });
}

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
  // update the messaging token
  session.set(sesh);
  if (sesh.user?.id) await refreshMessagingToken();
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
  await FirebaseFirestore.updateDocument({
    reference: `users/${get(session).user.id}`,
    data: { messagingToken: null },
  });
  friendSubmissions.set([]);
  songs.set([]);
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
    await goto('/main/home/');
  } else {
    const tempU = { ...u } as any;
    delete tempU.public;
    await FirebaseFirestore.setDocument({
      reference: `users/${u.id}`,
      data: tempU,
    });
    await FirebaseFirestore.setDocument({
      reference: `users/${u.id}/public/info`,
      data: {
        profile: {
          stats: {
            submissionCount: 0,
            onTimeSubmissionCount: 0,
          },
        },
      } as User['public'],
    });
    await goto('/intro/username');
  }

  session.update((s) => {
    return { ...s, loggedIn: true, user: u, loaded: true };
  });

  // manually update the messaging token
  await refreshMessagingToken();
  saveSession();
};
