import { map, atom, action } from 'nanostores';
import { Preferences } from '@capacitor/preferences';
import { Geolocation } from '@capacitor/geolocation';
import { SafeArea } from 'capacitor-plugin-safe-area';
import type {
  MusicPlatform,
  User,
  Location,
  ReverseGeolocationPosition,
  Submission,
} from './types';
import { NativeGeocoder } from '@capgo/nativegeocoder';
import { handleApiResponse, registerForNotifications, goto } from './lib';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export const currPath = atom<string>('/');

export const statusBarHeight = atom<number>(0);
export const getStatusBarHeight = action(
  statusBarHeight,
  'get-statusbar-height',
  async (store) => {
    const height = await SafeArea.getStatusBarHeight();
    store.set(height.statusBarHeight);
    return height.statusBarHeight;
  }
);

export const bottomInset = atom<number>(0);
export const getBottomInset = action(
  bottomInset,
  'get-bottom-inset',
  async (store) => {
    const insets = await SafeArea.getSafeAreaInsets();
    store.set(insets.insets.bottom);
    return insets.insets.bottom;
  }
);

export const location = map<Location>();
export const updateCurrentLocation = action(
  location,
  'update-location',
  async (store) => {
    try {
      await Geolocation.checkPermissions();
    } catch {
      await Geolocation.requestPermissions();
    }
    const l = store.get();
    l.gp = await Geolocation.getCurrentPosition();
    store.set(l);
  }
);
export const getReverseGeocode: () => Promise<ReverseGeolocationPosition> =
  action(location, 'reverse-geocode', async (store) => {
    const l = store.get();
    if (!l.gp) await updateCurrentLocation();
    if (!l.rgp) {
      l.rgp = await NativeGeocoder.reverseGeocode({
        latitude: l.gp.coords.latitude,
        longitude: l.gp.coords.longitude,
        apiKey: import.meta.env.VITE_GOOGLE_REVERSE_GEOCODING_KEY,
      });
    }
    return l.rgp;
  });

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
      console.log('Error grabbing new authToken. User must sign in.');
      return '';
    }
  }
);

export const user = map<User>();

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
    console.log('updateUsername');
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
    console.log('updateMusicPlatform');
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
export const loginUser = action(user, 'login-user', async (store) => {
  const u = store.get();
  u.messagingToken = await registerForNotifications().catch();
  const res = await fetch(
    'https://us-central1-friendsfm.cloudfunctions.net/loginUser',
    {
      method: 'POST',
      body: JSON.stringify(u),
    }
  );

  const json = await handleApiResponse(res);
  if (!json) {
    // handle login failure
    return false;
  }

  store.set(json.message as User);
  await updateUser(json.message);
  return true;
});
// Log thet user out
export const logout = action(user, 'logout', async (store) => {
  FirebaseAuthentication.signOut();
  store.set(null);
  await Preferences.remove({ key: 'user' });
});

export const userSubmission = map<Submission>();

export const generateSubmission = action(
  userSubmission,
  'generate-submission',
  async (store) => {
    console.log('generateSubmission');
    let location: GeolocationPosition;
    try {
      await Geolocation.requestPermissions();
      location = await Geolocation.getCurrentPosition();
    } catch (e) {
      console.log(e);
    }
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/createNewUserSubmission',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          latitude: location ? location.coords.latitude : undefined,
          longitude: location ? location.coords.longitude : undefined,
        }),
      }
    );
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    store.set(json.message.user as Submission);
    friendSubmissions.set(json.message.friends as Submission[]);
  }
);

export const friendSubmissions = atom<Submission[]>([]);

export const getSubmissionStatus = action(
  friendSubmissions,
  'get-submission-status',
  async (store) => {
    console.log('getSubmissionStatus');
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/getCurrentSubmissionStatus',
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
    store.set(json.message.friends as Submission[]);
    if (json.message.user) userSubmission.set(json.message.user as Submission);
  }
);
export const loading = atom<boolean>(false);

export const spotifyAuthCode = atom<string>('');
