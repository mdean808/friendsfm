import type { SavedSong, Submission, User } from './types';
import { writable, type Writable } from 'svelte/store';
import Preferences from './preferences';
import {
  FirebaseAuthentication,
  type SignInResult,
} from '@capacitor-firebase/authentication';

export type Session = {
  user: User;
  loggedIn: boolean;
  songs: SavedSong[];
  friendSubmissions: Submission[];
  token?: string;
};

export const session = <Writable<Session>>writable();

// update preferences whenever session state changes
session.subscribe(async (s) => {
  await Preferences.setUser(s.user);
  await Preferences.setLogin(s.loggedIn);
  await Preferences.setSongs(s.songs);
  await Preferences.setFriendSubmissions(s.friendSubmissions);
});

export const loadSession = async () => {
  session.set({
    user: await Preferences.getUser(),
    loggedIn: await Preferences.getLogin(),
    songs: await Preferences.getSongs(),
    friendSubmissions: await Preferences.getFriendSubmissions(),
    token: (await FirebaseAuthentication.getIdToken()).token,
  });
};

export const endSession = async () => {
  await FirebaseAuthentication.signOut();
  await Preferences.setUser();
  await Preferences.setLogin(false);
  await Preferences.setSongs();
  await Preferences.setFriendSubmissions();
  session.set({} as Session);
};

export const authSession = async (res: SignInResult) => {
  // auth failed!
  if (!res.user) return false;
  // update the session
  const token = await FirebaseAuthentication.getIdToken();
  const user = {
    ...res.user,
    id: res.user.uid,
    email: res.user.email,
    username: undefined,
    friends: [],
    friendRequests: [],
  };
  session.update((s) => {
    return { ...s, loggedIn: true, user, token: token.token };
  });
  // save the current user to preferences
  await Preferences.setUser(user);
};
