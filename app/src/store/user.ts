import type { AccessToken } from '@spotify/web-api-ts-sdk';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Preferences } from '@capacitor/preferences';
import { captureException } from '@sentry/capacitor';
import { map, action } from 'nanostores';
import {
  friendSubmissions,
  getFriendSubmissions,
  getNewAuthToken,
  getPlatform,
  loggedIn,
  loginState,
  network,
  platform,
  songs,
} from '.';
import { goto } from '../lib/util';
import {
  UserState,
  type MusicPlatform,
  type SavedSong,
  type Song,
  type Submission,
  type User,
  type UserStatistics,
} from '../types';

export const user = map<User>({} as User);
export const userStatistics = map<UserStatistics>({} as UserStatistics);

// Load user from preferences
export const getUserFromPreferences = action(
  user,
  'get-user-preferences',
  async (store) => {
    const res = await Preferences.get({ key: 'user' });
    if (!res.value) {
      goto('/new_user');
      return {} as User;
    }
    const u = JSON.parse(res.value) as User;
    store.set(u);

    const res2 = await Preferences.get({ key: 'logged-in' });
    loggedIn.set(res2.value === '1' ? true : false);

    const res3 = await Preferences.get({ key: 'songs' });
    songs.set(JSON.parse(res3.value || '[]') as SavedSong[]);

    // const res4 = await Preferences.get({ key: 'submission' });
    // userSubmission.set(JSON.parse(res4.value || '{}') as Submission);

    const res5 = await Preferences.get({ key: 'friend-submissions' });
    friendSubmissions.set(
      new Set(JSON.parse(res5.value || '[]') as Submission[])
    );

    // set the user's state
    if (!store.get().username) loginState.set(UserState.registeringUsername);
    else if (!store.get().musicPlatform)
      loginState.set(UserState.registeringMusicPlatform);
    else loginState.set(UserState.registered);

    return u;
  }
);

// Update user in preferences
export const updateUser = action(
  user,
  'update',
  async (store, newUser: User) => {
    await Preferences.set({ key: 'user', value: JSON.stringify(newUser) });
    await Preferences.set({
      key: 'songs',
      value: JSON.stringify(songs.get() || []),
    });
    await Preferences.set({
      key: 'logged-in',
      value: loggedIn.get() ? '1' : '0',
    });
    // await Preferences.set({
    //   key: 'submission',
    //   value: JSON.stringify(userSubmission.get() || {}),
    // });
    await Preferences.set({
      key: 'friend-submissions',
      value: JSON.stringify(friendSubmissions.get() || []),
    });
    store.set(newUser);
  }
);
// Set user's username
export const updateUsername = action(
  user,
  'update-username',
  async (store, newUsername: string) => {
    const u = store.get();
    const message = await network
      .get()
      .queryFirebase('setusername', { username: newUsername });
    if (!message) return;

    // update state
    if (!u.username) loginState.set(UserState.registeringMusicPlatform);
    u.username = newUsername;
    store.set(u);
    await updateUser(u);
    FirebaseAnalytics.setUserProperty({ key: 'username', value: newUsername });
    // username setting succeeded!
    return true;
  }
);
// Set music provider preferences (last step in registration)
export const updateMusicPlatform = action(
  user,
  'update-music-platform',
  async (
    store,
    newMusicPlatform: MusicPlatform,
    authCode?: string,
    musicPlatformAuth?: AccessToken
  ) => {
    const u = store.get();
    const message = await network.get().queryFirebase('setmusicplatform', {
      musicPlatform: newMusicPlatform,
      platformAuthCode: authCode,
      musicPlatformAuth,
    });
    if (!message) return;

    u.musicPlatform = newMusicPlatform;
    store.set(u);
    await updateUser(u);
    // update state
    loginState.set(UserState.registered);
    FirebaseAnalytics.setUserProperty({
      key: 'musicPlatform',
      value: newMusicPlatform,
    });
    // musuc platform set succeeded!
    return true;
  }
);

// get updated user data
export const refreshUser = action(user, 'get-user-data', async (store) => {
  if (!loggedIn.get() || loginState.get() !== UserState.registered)
    return false;
  let messagingToken = '';
  getPlatform();
  try {
    if (platform.get() !== 'web') {
      await FirebaseMessaging.checkPermissions().catch(
        async () => await FirebaseMessaging.requestPermissions()
      );
      messagingToken = (await FirebaseMessaging.getToken())?.token;
    }
  } catch (e) {
    captureException(e.message);
    console.log(e);
  }
  await getNewAuthToken();
  const message = await network
    .get()
    .queryFirebase('getuser', { messagingToken });
  if (!message) return;
  songs.set(message.songs as SavedSong[]);
  const u = message.user as User;
  // make sure we don't overwrite the bio or avatar
  if (u.profile.bio !== store.get()?.profile?.bio) {
    u.profile.bio = store.get()?.profile?.bio;
  }
  if (u.profile.avatarString !== store.get()?.profile?.avatarString) {
    u.profile.avatarString = store.get()?.profile?.avatarString;
  }
  await updateUser(u);
  // also update friend submissions
  await getFriendSubmissions();
});

export const unlinkMusicProvider = action(
  user,
  'unlink-music-provider',
  async (store) => {
    const message = await network.get().queryFirebase('unlinkmusicplatform');
    if (!message) return;
    const u = store.get();
    u.musicPlatform = null;
    await updateUser(u);
  }
);

export const getUserStatistics = action(
  userStatistics,
  'get-user-statistics',
  async (store) => {
    await getNewAuthToken();
    const message = await network.get().queryFirebase('getuserstatistics');
    if (!message) return;
    store.set(message as UserStatistics);
  }
);

export const setProfile = action(
  user,
  'set-user-profile',
  async (store, newProfile: User['profile']) => {
    const u = store.get();
    const message = await network
      .get()
      .queryFirebase('setprofile', { newProfile });
    if (!message) return;
    u.profile = newProfile;
    store.set(u);
  }
);

export const getUserCurrentlyListening = action(
  user,
  'get-user-currently-listening',
  async (_store, id, username?) => {
    const message = await network
      .get()
      .queryFirebase('getusercurrentlylistening', { id, username });
    if (!message) return;
    return message as Song;
  }
);

export const deleteUserAccount = action(
  user,
  'delete-user-account',
  async (_store) => {
    const message = await network.get().queryFirebase('deleteuser');
    if (!message) return;
    return message;
  }
);
