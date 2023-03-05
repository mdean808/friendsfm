import { action, atom } from 'nanostores';
import { Device } from '@capacitor/device';

export const currPath = atom<string>('/');

export const prevPath = atom<string>('');

export const loading = atom<boolean>(false);

export const platform = atom<string>('');

export const getPlatform = action(platform, 'get-platform', async (store) => {
  const info = await Device.getInfo();
  store.set(info.platform);
});

//TODO: request friend submissions, user data every 30(?) seconds
