import { Preferences } from '@capacitor/preferences';
import { map, action } from 'nanostores';
import { authToken } from '.';
import { handleApiResponse } from '../lib';
import type { MusicPlatform, User } from '../types';
export const user = map<User>({} as User);

// Load user from preferences
export const getUserFromPreferences = action(
  user,
  'get-user-preferences',
  async (store) => {
    const res = await Preferences.get({ key: 'user' });
    const u = JSON.parse(res.value);
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
    store.set(newUser);
  }
);
// Set user's username
export const updateUsername = action(
  user,
  'update-username',
  async (store, newUsername: string) => {
    const u = store.get();
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/setUsername',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          username: newUsername,
        }),
      }
    );
    if (!(await handleApiResponse(res))) {
      // failed to set new username
      return false;
    }
    u.username = newUsername;
    store.set(u);
    await updateUser(u);
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
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/setMusicPlatform',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          musicPlatform: newMusicPlatform,
          platformAuthCode: authCode,
        }),
      }
    );
    if (!(await handleApiResponse(res))) {
      // failed to set new music platform
      return false;
    }
    u.musicPlatform = newMusicPlatform;
    store.set(u);
    await updateUser(u);
    // musuc platform set succeeded!
    return true;
  }
);

// get updated user data
export const getUserData = action(user, 'get-user-data', async (_store) => {
  const res = await fetch(
    'https://us-central1-friendsfm.cloudfunctions.net/getUser',
    {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
      }),
    }
  );
  const json = await handleApiResponse(res);
  if (!json) {
    // failed to set new music platform
    return false;
  }

  await updateUser(json.message as User);
});
