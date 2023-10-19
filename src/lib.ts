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
import {
  FirebaseAnalytics,
  type LogEventOptions,
} from '@capacitor-firebase/analytics';
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
  FirebaseAnalytics.setCurrentScreen({ screenName: url });
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
  let eventParams: LogEventOptions['params'] = {};
  eventParams.status = res.status;
  eventParams.statusText = res.statusText;
  const toastError: SvelteToastOptions = {
    theme: {
      '--toastColor': 'white',
      '--toastBackground': '#ad2626',
      '--toastBarBackground': 'white',
    },
  };
  if (res.status >= 500) {
    toast.push('Error ' + res.status + ': ' + res.statusText, toastError);
    FirebaseAnalytics.logEvent({
      name: 'response',
      params: eventParams,
    });
    return;
  }
  const json = (await res.json()) as NetworkResponse;
  if (res.status !== 200 && !json) {
    toast.push('Error ' + res.status + ': ' + res.statusText, toastError);
    FirebaseAnalytics.logEvent({
      name: 'response',
      params: eventParams,
    });
    return false;
  } else if (json.type === ResponseType.error) {
    console.log('ERROR:', json);
    eventParams.message = json.message;
    eventParams.error = json.error;
    if (json.message === 'User does not exist.') {
      logout();
      goto('/new_user');
    } else if (json.message === 'Authentication Failed.') {
      await getNewAuthToken();
    } else if (
      json.message.includes('Spotify 403 Forbidden') ||
      json.message.includes('Spotify token refresh error')
    ) {
      const { value } = await Dialog.confirm({
        title: 'Spotify® Authentication',
        message:
          'You need to re-authenticate with Spotify® to proceed. Continue?',
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
    FirebaseAnalytics.logEvent({
      name: 'response',
      params: eventParams,
    });
    return false;
  }

  eventParams.message = json.message;
  FirebaseAnalytics.logEvent({
    name: 'response',
    params: eventParams,
  });
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

export const getShortDate = (date: Date) => {
  const monthNames = [
    'jan.',
    'feb.',
    'mar.',
    'apr.',
    'may',
    'jun.',
    'jul.',
    'aug.',
    'sep.',
    'oct.',
    'nov.',
    'dec.',
  ];
  const monthIndex = date.getMonth();
  const day = date.getDate();
  let ordinalIndicator = 'th';
  if (day === 1 || day === 21 || day === 31) {
    ordinalIndicator = 'st';
  } else if (day === 2 || day === 22) {
    ordinalIndicator = 'nd';
  } else if (day === 3 || day === 23) {
    ordinalIndicator = 'rd';
  }
  return `${monthNames[monthIndex]} ${day}${ordinalIndicator}`;
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
  let url = '';
  if (import.meta.env.DEV) {
    url = `http://127.0.0.1:5001/friendsfm/us-central1/${endpoint}`;
  } else {
    url = `https://${endpoint}-tprlxlzyxq-uc.a.run.app`;
  }
  FirebaseAnalytics.logEvent({ name: 'request', params: { url } });
  return url;
};

export function hashCode(str: string, seed: number) {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function getRelativeLuminance(rgb: [number, number, number]) {
  let [r, g, b] = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
) {
  let l1 = getRelativeLuminance(rgb1);
  let l2 = getRelativeLuminance(rgb2);
  return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
}

export function intToRGB(i: number) {
  let c = (i & 0x00ffffff).toString(16).toUpperCase();
  let hex = '#' + '00000'.substring(0, 6 - c.length) + c;
  let rgb = hex.match(/.{2}/g).map((v) => parseInt(v, 16)) as [
    number,
    number,
    number,
  ];
  let contrast = getContrastRatio(rgb, [31, 41, 55]);
  while (contrast < 4.5) {
    i++;
    c = (i & 0x00ffffff).toString(16).toUpperCase();
    hex = '#' + '00000'.substring(0, 6 - c.length) + c;
    rgb = hex.match(/.{2}/g).map((v) => parseInt(v, 16)) as [
      number,
      number,
      number,
    ];
    contrast = getContrastRatio(rgb, [31, 41, 55]);
  }
  return hex;
}
