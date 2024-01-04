import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirebaseAppCheck } from '@capacitor-firebase/app-check';
import { Preferences } from '@capacitor/preferences';
import { atom, action, map } from 'nanostores';
import {
  friendSubmissions,
  homepageLoaded,
  refreshUser,
  songs,
  updateUser,
  user,
  userSubmission,
} from '.';
import {
  getFirebaseUrl,
  goto,
  handleApiResponse,
  registerForNotifications,
} from '../lib';
import { UserState, type SavedSong, type User } from '../types';

// refresh every 10 seconds
export const userRefreshInterval = map<NodeJS.Timer>(
  setInterval(refreshUser, 10 * 1000)
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

export const loginState = atom<UserState>(UserState.unregistered);

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
      console.log(e);
      // user isn't logged in anymore
      loggedIn.set(false);
      loginState.set(UserState.unregistered);
      authToken.set('');
      goto('/new_user');
      console.log('Error grabbing new authToken. User must sign in.');
    }
  }
);

export const loginUser = action(user, 'login-user', async (store) => {
  const u = store.get();
  u.messagingToken = await registerForNotifications();
  const res = await fetch(getFirebaseUrl('loginuser'), {
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
  // set the user's state
  if (!store.get().username) loginState.set(UserState.registeringUsername);
  else if (!store.get().musicPlatform)
    loginState.set(UserState.registeringMusicPlatform);
  else loginState.set(UserState.registered);
  // log the event
  FirebaseAnalytics.setUserId({ userId: store.get().id });
  FirebaseAnalytics.logEvent({ name: 'login', params: { id: store.get().id } });
  return true;
});

// Log the user out
export const logout = action(user, 'logout', async (store) => {
  //this removes the device's messaging token from the user in the database
  fetch(getFirebaseUrl('logoutuser'), {
    method: 'POST',
    body: JSON.stringify({ authToken: authToken.get() }),
    headers: { 'x-firebase-appcheck': appCheckToken.get() },
  });

  FirebaseAnalytics.logEvent({
    name: 'logout',
    params: { id: store.get()?.id },
  });
  await FirebaseAuthentication.signOut();
  loggedIn.set(false);
  loginState.set(UserState.unregistered);
  homepageLoaded.set(false);
  store.set(null);
  userSubmission.set(null);
  friendSubmissions.set(null);
  authToken.set(null);
  await Preferences.remove({ key: 'user' });
  await Preferences.remove({ key: 'songs' });
  await Preferences.set({ key: 'logged_in', value: '0' });
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
