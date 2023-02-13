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
import { handleApiResponse, registerForNotifications } from './lib';
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

export const user = map<User>();
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
    u.authToken = (await FirebaseAuthentication.getIdToken()).token;
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/setUsername',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: u.authToken,
          username: newUsername,
        }),
      }
    );
    if (!(await handleApiResponse(res))) {
      // failed to set new username
      return false;
    }
    u.username = newUsername;
    await Preferences.set({ key: 'user', value: JSON.stringify(u) });
    store.set(u);
    // username setting succeeded!
    return true;
  }
);
// Set music provider preferences (last step in registration)
export const updateMusicPlatform = action(
  user,
  'update-music-platform',
  async (store, newMusicPlatform: MusicPlatform) => {
    const u = store.get();
    u.authToken = (await FirebaseAuthentication.getIdToken()).token;
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/setMusicPlatform',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: u.authToken,
          musicPlatform: newMusicPlatform,
        }),
      }
    );
    if (!(await handleApiResponse(res))) {
      // failed to set new music platform
      return false;
    }
    u.musicPlatform = newMusicPlatform;
    u.registered = true;
    await Preferences.set({
      key: 'user',
      value: JSON.stringify(u),
    });
    store.set(u);
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

  await Preferences.set({
    key: 'user',
    value: JSON.stringify(u),
  });
  return true;
});
// Log thet user out
export const logout = action(user, 'logout', async (store) => {
  FirebaseAuthentication.signOut();
  store.set(null);
  await Preferences.remove({ key: 'user' });
});

export const submissions = atom<Submission[]>([]);

export const loading = atom<boolean>(false);
