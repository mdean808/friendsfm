import { action, atom, map } from 'nanostores';
import { Device } from '@capacitor/device';
import type { Notification } from '@capacitor-firebase/messaging';
import Network from '../lib/classes/Network';

export const currPath = atom<string>('');

export const prevPath = atom<string>('');

export const loading = atom<boolean>(false);

export const header = atom<string>('');

export const appLoading = atom<boolean>(true);
export const secondaryAppLoading = atom<boolean>(false);
export const singleSubmissionLoading = atom<boolean>(false);

export const submissionLoading = atom<boolean>(false);

export const activeHomeTab = atom<'submissions' | 'genres'>('submissions');

export const homepageLoaded = atom<boolean>(false);

export const launchStatus = atom<'background' | 'fresh'>('fresh');

export const deepLink = atom<boolean>(false);

export const platform = atom<string>('');

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

export const activeGenre = atom<string>('');

export const navDate = map<Date>(new Date());

export const searchType = atom<'track' | 'album' | 'playlist' | 'artist'>(
  'track'
);

export const editingProfile = atom<boolean>(false);

export const publicProfileUsername = atom<string>('');

export const keyboardHeight = atom<number>(0);

export const toast = map<{
  visible: boolean;
  content?: string;
  color?: string;
  duration?: number;
  offset?: number;
  onClick?: () => void;
}>();

// network store stuff
export const network = map<Network>(new Network());
