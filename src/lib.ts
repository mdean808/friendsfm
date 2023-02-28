import { MusicPlatform, ResponseType, type NetworkResponse } from './types';
import { currPath, prevPath } from './store';
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
  prevPath.set(currPath.get());
  currPath.set(url);
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
      '--toastContainerTop': 'auto',
      '--toastContainerRight': 'auto',
      '--toastContainerBottom': '8rem',
      '--toastContainerLeft': 'calc(50vw - 8rem);',
    },
  };
  if (res.status !== 200 && !json) {
    toast.push('Error ' + res.status + ': ' + res.statusText, toastError);
    return false;
  } else if (json.type === ResponseType.error) {
    console.log('ERROR:', json);
    toast.push('Error: ' + json.message, toastError);
    return false;
  }

  return json;
};

export const formatDurationPlayed = (duration: number) => {
  const d = new Date(Date.UTC(0, 0, 0, 0, 0, 0, duration * 1000)),
    // Pull out parts of interest
    parts = [d.getUTCMinutes(), d.getUTCSeconds()];
  // Zero-pad
  return parts.map((s) => String(s).padStart(2, '0')).join(':');
};

export const formatTimePlayed = (time: number = Date.now()) => {
  const date = new Date(time);
  return date.toLocaleTimeString();
};
