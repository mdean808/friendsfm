import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { captureException } from '@sentry/capacitor';
import { map, action, allTasks } from 'nanostores';
import {
  appCheckToken,
  authToken,
  friendSubmissions,
  getFriendSubmissions,
  getNewAuthToken,
  loggedIn,
  songs,
} from '.';
import { getFirebaseUrl, goto, handleApiResponse } from '../lib';
import type {
  MusicPlatform,
  SavedSong,
  Submission,
  User,
  UserStatistics,
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
    friendSubmissions.set(JSON.parse(res5.value || '[]') as Submission[]);

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
    const res = await fetch(getFirebaseUrl('setusername'), {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
        username: newUsername,
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    if (!(await handleApiResponse(res))) {
      // failed to set new username
      return false;
    }
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
  async (store, newMusicPlatform: MusicPlatform, authCode?: string) => {
    const u = store.get();
    const res = await fetch(getFirebaseUrl('setmusicplatform'), {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
        musicPlatform: newMusicPlatform,
        platformAuthCode: authCode,
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    if (!(await handleApiResponse(res))) {
      // failed to set new music platform
      return false;
    }
    u.musicPlatform = newMusicPlatform;
    store.set(u);
    await updateUser(u);
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
  if (!loggedIn.get()) return false;
  let messagingToken = '';
  try {
    if (Capacitor.getPlatform() !== 'web') {
      await FirebaseMessaging.checkPermissions().catch(
        async () => await FirebaseMessaging.requestPermissions()
      );
      messagingToken = (await FirebaseMessaging.getToken())?.token;
    }
  } catch (e) {
    captureException(e.message);
    console.log(e);
  }
  // await getNewAuthToken();
  const res = await fetch(getFirebaseUrl('getuser'), {
    method: 'POST',
    body: JSON.stringify({
      authToken: authToken.get(),
      messagingToken,
    }),
    headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
  });
  const json = await handleApiResponse(res);
  if (!json) {
    // failed to refresh user
    return false;
  }
  songs.set(json.message.songs as SavedSong[]);
  const u = json.message.user as User;
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
    const res = await fetch(getFirebaseUrl('unlinkmusicplatform'), {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to unlink provider
      return false;
    }
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
    const res = await fetch(getFirebaseUrl('getuserstatistics'), {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to unlink provider
      return false;
    }
    store.set(json.message as UserStatistics);
  }
);

export const setProfile = action(
  user,
  'set-user-profile',
  async (store, newProfile: User['profile']) => {
    const u = store.get();
    const res = await fetch(getFirebaseUrl('setprofile'), {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
        newProfile,
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to unlink provider
      return false;
    }
    u.profile = newProfile;
    store.set(u);
  }
);
