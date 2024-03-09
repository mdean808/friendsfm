import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Preferences } from '@capacitor/preferences';
import { atom, action, map } from 'nanostores';
import {
  friendSubmissions,
  homepageLoaded,
  network,
  refreshUser,
  songs,
  updateUser,
  user,
  userSubmission,
} from '.';
import { UserState, type SavedSong, type User } from '../types';
import { goto, registerForNotifications } from '../lib/util';

// refresh every 10 seconds
export const userRefreshInterval = map<NodeJS.Timeout>(
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
  const message = await network.get().queryFirebase('loginuser', u);

  if (!message) return;
  loggedIn.set(true);
  songs.set(message.songs as SavedSong[]);
  await updateUser(message.user as User);
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
export const logout = action(
  user,
  'logout',
  async (store, keepToken?: boolean) => {
    //this removes the device's messaging token from the user in the database
    loggedIn.set(false);
    if (!keepToken) await network.get().queryFirebase('logoutuser');

    FirebaseAnalytics.logEvent({
      name: 'logout',
      params: { id: store.get()?.id },
    });
    await FirebaseAuthentication.signOut();
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
  }
);
