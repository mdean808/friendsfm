import { map, atom, action } from 'nanostores';
import {
  NativeSettings,
  IOSSettings,
  AndroidSettings,
} from 'capacitor-native-settings';
import { SafeArea, type SafeAreaInsets } from 'capacitor-plugin-safe-area';
import type { Location, ReverseGeolocationPosition } from '../types';
import { NativeGeocoder } from '@capgo/nativegeocoder';
import { Geolocation } from '@capacitor/geolocation';
import { Dialog } from '@capacitor/dialog';
import { Capacitor } from '@capacitor/core';

export const keyboardHeight = atom<number>(0);

export const platform = atom<string>('');

export const getPlatform = action(platform, 'get-platform', async (store) => {
  const platform = Capacitor.getPlatform();
  store.set(platform);
});

export const statusBarHeight = atom<number>(0);
export const getStatusBarHeight = action(
  statusBarHeight,
  'get-statusbar-height',
  async (store) => {
    const height = await SafeArea.getStatusBarHeight();
    store.set(height.statusBarHeight);
    return height.statusBarHeight;
  }
);

export const insets = map<SafeAreaInsets['insets']>();
export const getInsets = action(insets, 'get-insets', async (store) => {
  const insets = await SafeArea.getSafeAreaInsets();
  store.set(insets.insets);
  return insets.insets;
});

export const location = map<Location>();
export const updateCurrentLocation = action(
  location,
  'update-location',
  async (store) => {
    if (platform.get() !== 'web') {
      try {
        await Geolocation.checkPermissions();
      } catch {
        await Geolocation.requestPermissions();
      }
      const l = store.get();
      try {
        l.gp = await Geolocation.getCurrentPosition();
      } catch (e) {
        if (store.get().gp) return;
        const { value } = await Dialog.confirm({
          title: 'Location Permissions',
          message:
            'Location permissions need to be enabled to use this feature. Please enable them in settings.',
          okButtonTitle: 'Settings',
          cancelButtonTitle: 'Ignore',
        });
        if (value) {
          NativeSettings.open({
            optionIOS: IOSSettings.App,
            optionAndroid: AndroidSettings.ApplicationDetails,
          });
        }
      }
      store.set(l);
    } else {
      store.set({
        gp: {
          coords: {
            latitude: 0,
            longitude: 0,
          },
        },
      } as Location);
    }
  }
);
export const getReverseGeocode: () => Promise<ReverseGeolocationPosition> =
  action(location, 'reverse-geocode', async (store) => {
    const l = store.get();
    if (!l.gp) await updateCurrentLocation();
    if (!l.rgp) {
      l.rgp = await NativeGeocoder.reverseGeocode({
        latitude: l.gp.coords.latitude,
        longitude: l.gp.coords.longitude,
        apiKey: import.meta.env.VITE_GOOGLE_REVERSE_GEOCODING_KEY,
      });
    }
    return l.rgp;
  });
