import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { currPath, platform, prevPath, toast } from '../store';
import * as Sentry from '@sentry/capacitor';

export const goto = (url: string) => {
  prevPath.set(currPath.get());
  currPath.set(url);
  //  history.pushState(null, null, url);
  FirebaseAnalytics.setCurrentScreen({
    screenName: url,
    screenClassOverride: url,
  });
};

export const registerForNotifications = async () => {
  if (platform.get() === 'web') return;
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

export function errorToast(options: {
  content: string;
  duration?: number;
  offset?: number;
  onClick?: () => void;
}) {
  console.log('error toast: ' + options.content);
  showToast({ color: '#ad2626', ...options });
}

export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function hashCode(str: string, seed: number) {
  let hash = seed;
  for (let i = 0; i < str?.length; i++) {
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
  let hex = '#' + '00000'.substring(0, 6 - c?.length) + c;
  let rgb = hex.match(/.{2}/g).map((v) => parseInt(v, 16)) as [
    number,
    number,
    number,
  ];
  let contrast = getContrastRatio(rgb, [31, 41, 55]);
  while (contrast < 4.5) {
    i++;
    c = (i & 0x00ffffff).toString(16).toUpperCase();
    hex = '#' + '00000'.substring(0, 6 - c?.length) + c;
    rgb = hex.match(/.{2}/g).map((v) => parseInt(v, 16)) as [
      number,
      number,
      number,
    ];
    contrast = getContrastRatio(rgb, [31, 41, 55]);
  }
  return hex;
}

export const showToast = (options: {
  content: string;
  color?: string;
  duration?: number;
  offset?: number;
  onClick?: () => void;
}) => {
  options.onClick =
    options.onClick || (() => toast.set({ visible: false, ...options }));
  toast.set({ visible: true, ...options });
  setTimeout(
    () => toast.set({ visible: false, ...options }),
    options.duration || 5000
  );
};
