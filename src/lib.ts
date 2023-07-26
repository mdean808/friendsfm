import { MusicPlatform, ResponseType, type NetworkResponse } from './types';
import {
  currPath,
  getNewAuthToken,
  logout,
  prevPath,
  spotifyAuthCode,
  updateMusicPlatform,
} from './store';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { toast, type SvelteToastOptions } from '@zerodevx/svelte-toast';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { App } from '@capacitor/app';
import { Dialog } from '@capacitor/dialog';
import * as Sentry from '@sentry/capacitor';

let spotifySet: boolean;

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
  FirebaseAnalytics.setCurrentScreen({ screenName: url.split('/')[1] });
};

export const registerForNotifications = async () => {
  try {
    await FirebaseMessaging.checkPermissions().catch(
      async () => await FirebaseMessaging.requestPermissions()
    );
    // subscribe device to 'all' topic
    await FirebaseMessaging.subscribeToTopic({ topic: 'all' });
    const token = await FirebaseMessaging.getToken();
    return token.token;
  } catch (e) {
    Sentry.withScope((scope) => {
      scope.setContext('client-notifications', {
        message: 'Error registering user for notifications.',
      });
    });
    Sentry.captureException(e);
    console.log(`Error registering for notifications: ${e}`);
  }
};

export const handleApiResponse = async (res: Response) => {
  const toastError: SvelteToastOptions = {
    theme: {
      '--toastColor': 'white',
      '--toastBackground': '#ad2626',
      '--toastBarBackground': 'white',
    },
  };
  if (res.status >= 500) {
    toast.push('Error ' + res.status + ': ' + res.statusText, toastError);
    return;
  }
  const json = (await res.json()) as NetworkResponse;
  if (res.status !== 200 && !json) {
    toast.push('Error ' + res.status + ': ' + res.statusText, toastError);
    return false;
  } else if (json.type === ResponseType.error) {
    console.log('ERROR:', json);
    if (json.message === 'User does not exist.') {
      logout();
      goto('/new_user');
    } else if (json.message === 'Authentication Failed.') {
      if (json.error.includes('Decoding Firebase ID token')) {
        logout();
        goto('/new_user');
      } else {
        await getNewAuthToken();
      }
    } else if (
      json.message.includes('Spotify 403 Forbidden') ||
      json.message.includes('Spotify token refresh error')
    ) {
      const { value } = await Dialog.confirm({
        title: 'Spotify Authentication',
        message:
          'You need to re-authenticate with Spotify to proceed. Continue?',
      });
      if (value) {
        spotifySet = false;
        spotifyAuthCode.listen(async (value: string) => {
          if (!spotifySet) {
            await updateMusicPlatform(MusicPlatform.spotify, value);
            spotifySet = true;
          }
        });
        const spotifyUrl = `https://accounts.spotify.com/authorize?client_id=${
          import.meta.env.VITE_SPOTIFY_CLIENT_ID
        }&response_type=code&redirect_uri=${
          import.meta.env.VITE_SPOTIFY_REDIRECT_URL
        }&scope=user-read-private%20user-read-currently-playing%20user-read-recently-played%20playlist-modify-private%20playlist-modify-public`;
        window.location.href = spotifyUrl;
      }
    } else {
      toast.push('Error: ' + json.message, toastError);
    }
    return false;
  }

  return json;
};

export const formatDurationPlayed = (duration: number) => {
  const d = new Date(Date.UTC(0, 0, 0, 0, 0, 0, duration * 1000));
  return d.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
};

export const formatTimePlayed = (time: number = Date.now()) => {
  const date = new Date(time);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const getDaysAgo = (date: Date) => {
  const currDate = new Date();
  const diffDays = currDate.getDate() - date.getDate();
  switch (diffDays) {
    case 0:
      return 'today';
    case 1:
      return 'yesterday';
    default:
      return `${diffDays} days ago`;
  }
};

export const convertDateToLateString = (date: Date) => {
  if (isNaN(date.getTime())) return 'infinitely late';
  const rootDate = new Date(0);
  const days = daysBetweenDates(rootDate, date);
  const hours = Math.floor(
    Math.abs(rootDate.getTime() - date.getTime()) / 36e5
  );
  const minutes = date.getMinutes() - rootDate.getMinutes();
  const seconds = date.getSeconds() - rootDate.getSeconds();
  let res = '';
  if (days <= 2 && hours === 0 && minutes === 0) res = seconds + 's late';
  else if (days <= 2 && hours === 0) res = minutes + ' min late';
  else if (days <= 2) res = hours + ' hr late';
  else res = days + ' days late';
  return res;
};

export const daysBetweenDates = (date1: Date, date2: Date) =>
  Math.ceil(
    Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)
  );

export const handleError = (e: PromiseRejectionEvent) => {
  FirebaseCrashlytics.recordException({ message: e.type });
};

export const getAppVersion = async () => {
  try {
    return (await App.getInfo()).version;
  } catch (e) {
    return 'web';
  }
};

export const getFirebaseUrl = (endpoint: string) => {
  if (import.meta.env.DEV) {
    return `http://127.0.0.1:5001/friendsfm/us-central1/${endpoint}`;
  } else {
    return `https://${endpoint}-tprlxlzyxq-uc.a.run.app`;
  }
};
