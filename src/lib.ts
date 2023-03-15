import { MusicPlatform, ResponseType, type NetworkResponse } from './types';
import { currPath, getNewAuthToken, logout, prevPath } from './store';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { toast, type SvelteToastOptions } from '@zerodevx/svelte-toast';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const getPlatformColor = (platform: MusicPlatform) => {
  switch (platform) {
    case MusicPlatform.spotify:
      return 'spotify';
    case MusicPlatform.appleMusic:
      return 'apple-music';
  }
};

export const goto = (url: string) => {
  FirebaseAnalytics.setCurrentScreen({ screenName: url.split('/')[1] });
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
    },
  };
  if (res.status !== 200 && !json) {
    toast.push('Error ' + res.status + ': ' + res.statusText, toastError);
    return false;
  } else if (json.type === ResponseType.error) {
    console.log('ERROR:', json);
    if (json.message === 'User does not exist.') {
      logout();
      goto('/new_user');
    } else if (json.message === 'Authentication Failed.') {
      await getNewAuthToken();
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
  console.log(diffDays);
  switch (diffDays) {
    case 0:
      return 'today';
    case 1:
      return 'yesterday';
    default:
      return `${diffDays} ago`;
  }
};

export const convertDateToLateString = (date: Date) => {
  if (isNaN(date.getTime())) return 'infinitely late';
  const rootDate = new Date(0);
  const days = date.getDate() - rootDate.getDate();
  const hours = date.getHours() - rootDate.getHours();
  const minutes = date.getMinutes() - rootDate.getMinutes();
  const seconds = date.getSeconds() - rootDate.getSeconds();
  // const time = date.toLocaleTimeString().split(' ')[0];
  // const hours = parseInt(time.split(':')[0]);
  // const minutes = parseInt(time.split(':')[1]);
  // const seconds = parseInt(time.split(':')[2]);
  const alternateHours = rootDate.getHours() - date.getHours();
  let res = '';
  if ((days > 0 && hours < 4) || hours > 20) res = days + 'd late';
  else if (days > 0 && hours > 3 && hours < 21)
    res = days + 'd ' + hours + 'h late';
  else if (days < 0 && alternateHours > 3 && alternateHours < 21)
    res = '1d ' + (rootDate.getHours() - date.getHours()) + 'h late';
  else if (hours === 0 && minutes === 0) res = seconds + 's late';
  else if (hours === 0) res = minutes + 'm late';
  else if (minutes > 20 && minutes < 45)
    res = hours + 'h ' + minutes + 'm late';
  else res = hours + 'h late';
  return res;
};

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
