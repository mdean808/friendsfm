import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Preferences } from '@capacitor/preferences';
import { map, action } from 'nanostores';
import { authToken, FIREBASE_URL, loggedIn, songs } from '.';
import { goto, handleApiResponse } from '../lib';
import type { MusicPlatform, SavedSong, User } from '../types';
export const user = map<User>({} as User);

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
    loggedIn.set(true);
    store.set(u);
    return u;
  }
);

// Update user in preferences
export const updateUser = action(
  user,
  'update',
  async (store, newUser: User) => {
    await Preferences.set({ key: 'user', value: JSON.stringify(newUser) });
    await Preferences.set({ key: 'songs', value: JSON.stringify(songs.get()) });
    store.set(newUser);
  }
);
// Set user's username
export const updateUsername = action(
  user,
  'update-username',
  async (store, newUsername: string) => {
    const u = store.get();
    const res = await fetch(FIREBASE_URL.get() + '/setUsername', {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
        username: newUsername,
      }),
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
    const res = await fetch(FIREBASE_URL.get() + '/setMusicPlatform', {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
        musicPlatform: newMusicPlatform,
        platformAuthCode: authCode,
      }),
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
export const refreshUser = action(user, 'get-user-data', async (_store) => {
  if (!loggedIn.get()) return false;
  let messagingToken = '';
  try {
    await FirebaseMessaging.checkPermissions().catch(
      async () => await FirebaseMessaging.requestPermissions()
    );
    messagingToken = (await FirebaseMessaging.getToken())?.token;
  } catch (e) {
    console.log(e);
  }
  // await getNewAuthToken();
  const res = await fetch(FIREBASE_URL.get() + '/getUser', {
    method: 'POST',
    body: JSON.stringify({
      authToken: authToken.get(),
      messagingToken,
    }),
  });
  const json = await handleApiResponse(res);
  if (!json) {
    // failed to refresh user
    return false;
  }
  songs.set(json.message.songs as SavedSong[]);
  await updateUser(json.message.user as User);
});
