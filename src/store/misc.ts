import { action, atom, map } from 'nanostores';
import { Device } from '@capacitor/device';
import type { Notification } from '@capacitor-firebase/messaging';
import type { CupertinoPane } from 'cupertino-pane';

export const currPath = atom<string>('/');

export const prevPath = atom<string>('');

export const loading = atom<boolean>(false);

export const appLoading = atom<boolean>(true);

export const homepageLoaded = atom<boolean>(false);

export const platform = atom<string>('');

export const activeGenre = atom<string>('');

export const genrePane = map<CupertinoPane>();

export const getPlatform = action(platform, 'get-platform', async (store) => {
  const info = await Device.getInfo();
  store.set(info.platform);
});

// export const FIREBASE_URL = atom<string>(
//   import.meta.env.DEV
//     ? 'http://localhost:5001/friendsfm/us-central1'
//     : 'https://us-central1-friendsfm.cloudfunctions.net'
// );

export const notificationAction = map<Notification>();
