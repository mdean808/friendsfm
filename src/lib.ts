import {
  MusicPlatform,
  ResponseType,
  type NetworkResponse,
  type User,
} from './types';
import { router } from 'tinro';
import { currPath } from './store';
import { Preferences } from '@capacitor/preferences';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { toast, type SvelteToastOptions } from '@zerodevx/svelte-toast';

export const getPlatformColor = (platform: MusicPlatform) => {
  switch (platform) {
    case MusicPlatform.spotify:
      return 'spotify';
    case MusicPlatform.appleMusic:
      return 'apple-music';
  }
};

export const goto = (url: string) => {
  currPath.set(url);
  router.goto(url);
};

export const getUserFromPreferences = async () => {
  const res = await Preferences.get({ key: 'user' });
  return JSON.parse(res.value);
};

export const registerForNotifications = async () => {
  try {
    await FirebaseMessaging.checkPermissions().catch(
      async () => await FirebaseMessaging.requestPermissions()
    );
    // subscribe device to 'all' topic
    await FirebaseMessaging.subscribeToTopic({ topic: 'all' });
    return (await FirebaseMessaging.getToken()).token;
  } catch (e) {
    console.log(`Error registering for notifications: ${e}`);
  }
};

export const handleApiResponse = async (res: Response) => {
  const json = (await res.json()) as NetworkResponse;
  const toastError: SvelteToastOptions = {
    theme: {
      '--toastColor': 'white',
      '--toastBackground': '#ad2626',
      '--toastBarBackground': 'white',
    },
  };
  if (res.status !== 200 && !json) {
    toast.push('Error ' + res.status + ': ' + res.statusText, toastError);
    return false;
  } else if (json.type === ResponseType.error) {
    toast.push(
      'Error: ' + JSON.stringify(json.message, null, '\t'),
      toastError
    );
    return false;
  }

  return true;
};
