import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirebaseAppCheck } from '@capacitor-firebase/app-check';
import { Preferences } from '@capacitor/preferences';
import { atom, action, map } from 'nanostores';
import {
  FIREBASE_URL,
  friendSubmissions,
  homepageLoaded,
  refreshUser,
  songs,
  updateUser,
  user,
  userSubmission,
} from '.';
import { goto, handleApiResponse, registerForNotifications } from '../lib';
import type { SavedSong, User } from '../types';

// refresh every 30 seconds
export const userRefreshInterval = map<NodeJS.Timer>(
  setInterval(refreshUser, 30 * 1000)
);

export const stopRefreshInterval = action(
  userRefreshInterval,
  'stop-refresh-interval',
  (store) => {
    clearInterval(store.get());
  }
);

// store
export const spotifyAuthCode = atom<string>('');

export const loggedIn = atom<boolean>(false);

export const authToken = atom<string>('');
export const getNewAuthToken = action(
  authToken,
  'new-authtoken',
  async (store) => {
    try {
      const res = await FirebaseAuthentication.getIdToken();
      store.set(res.token);
      return res.token;
    } catch (e) {
      // user isn't logged in anymore
      loggedIn.set(false);
      goto('/new_user');
      console.log('Error grabbing new authToken. User must sign in.');
    }
  }
);

export const loginUser = action(user, 'login-user', async (store) => {
  const u = store.get();
  u.messagingToken = await registerForNotifications().catch();
  const res = await fetch(FIREBASE_URL.get() + '/loginUser', {
    method: 'POST',
    body: JSON.stringify(u),
    headers: { 'x-firebase-appcheck': appCheckToken.get() },
  });

  const json = await handleApiResponse(res);
  if (!json) {
    // handle login failure
    return false;
  }

  loggedIn.set(true);
  songs.set(json.message.songs as SavedSong[]);
  await updateUser(json.message.user as User);
  FirebaseAnalytics.setUserId({ userId: store.get().id });
  FirebaseAnalytics.logEvent({ name: 'login', params: { id: store.get().id } });
  return true;
});

// Log the user out
export const logout = action(user, 'logout', async (store) => {
  FirebaseAnalytics.logEvent({
    name: 'logout',
    params: { id: store.get().id },
  });
  await FirebaseAuthentication.signOut();
  loggedIn.set(false);
  homepageLoaded.set(false);
  store.set(null);
  userSubmission.set(null);
  friendSubmissions.set(null);
  authToken.set(null);
  await Preferences.remove({ key: 'user' });
  await Preferences.remove({ key: 'songs' });
  await Preferences.remove({ key: 'loggedIn' });
  await Preferences.remove({ key: 'submission' });
  await Preferences.remove({ key: 'friend-submissions' });
});

export const appCheckToken = atom<string>('');

export const getAppCheckToken = action(
  appCheckToken,
  'get-app-check-token',
  async (store) => {
    const { token } = await FirebaseAppCheck.getToken();
    store.set(token);
  }
);

export const initAppCheck = action(
  appCheckToken,
  'init-app-check',
  async (store) => {
    await FirebaseAppCheck.initialize({
      debug: import.meta.env.DEV,
      isTokenAutoRefreshEnabled: true,
      siteKey: '6LfulmYlAAAAAJwLoH096WItcxGwHy-CpQPU-aQG',
    });
    await FirebaseAppCheck.addListener('tokenChanged', (event) => {
      store.set(event.token);
    });
  }
);
