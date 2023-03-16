import { action, atom, map } from 'nanostores';
import { Device } from '@capacitor/device';
import type { PushNotificationSchema } from '@capacitor/push-notifications';

export const currPath = atom<string>('/');

export const prevPath = atom<string>('');

export const loading = atom<boolean>(false);

export const platform = atom<string>('');

export const getPlatform = action(platform, 'get-platform', async (store) => {
  const info = await Device.getInfo();
  store.set(info.platform);
});

export const FIREBASE_URL = atom<string>(
  // import.meta.env.DEV
  //   ? 'http://localhost:5001/friendsfm/us-central1'
  //   : 'https://us-central1-friendsfm.cloudfunctions.net'
  'https://us-central1-friendsfm.cloudfunctions.net'
);

export const notificationAction = map<PushNotificationSchema>();
