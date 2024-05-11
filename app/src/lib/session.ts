import type { SavedSong, Submission, User } from './types';
import { get, writable, type Writable } from 'svelte/store';
import Preferences from './preferences';
import {
  FirebaseAuthentication,
  type AuthStateChange,
  type SignInResult,
} from '@capacitor-firebase/authentication';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, unsubscribeSnapshots } from './firebase';

export type Session = {
  user: User;
  loggedIn: boolean;
  songs: SavedSong[];
  friendSubmissions: Submission[];
};

export const session = <Writable<Session>>writable({} as Session);

export const loadSession = async () => {
  const sesh = {
    user: await Preferences.getUser(),
    loggedIn: await Preferences.getLogin(),
    songs: await Preferences.getSongs(),
    friendSubmissions: await Preferences.getFriendSubmissions(),
  };
  session.set(sesh);
};

export const endSession = async () => {
  unsubscribeSnapshots();
  await FirebaseAuthentication.signOut();
  await Preferences.setUser();
  await Preferences.setLogin(false);
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
  let u = {
    id: loginData?.uid,
    email: loginData?.email,
    friends: [],
    friendRequests: [],
    public: {
      username: undefined,
    },
  } as User;
  const dbUser = await getDoc(doc(db, 'users', u.id));

  if (dbUser.exists()) {
    const publicData = await getDoc(doc(db, 'users', u.id, 'public', 'info'));
    u = {
      ...(dbUser.data() as User),
      id: dbUser.id,
      email: u.email,
      public: publicData.data() as User['public'],
    };
  } else {
    await setDoc(doc(db, 'users' + u.id), u);
  }

  session.update((s) => {
    return { ...s, loggedIn: true, user: u };
  });
};
