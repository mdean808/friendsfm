import { AndroidSettings, IOSSettings, NativeSettings } from 'capacitor-native-settings';
import { SafeArea, type SafeAreaInsets } from 'capacitor-plugin-safe-area';
import type { Location } from '$lib/types';
import { Geolocation } from '@capacitor/geolocation';
import { Dialog } from '@capacitor/dialog';
import { Preferences } from '@capacitor/preferences';
import { get, writable, type Writable } from 'svelte/store';
import { Capacitor } from '@capacitor/core';

export const keyboardHeight = <Writable<number>>writable(0);
export const insets = <Writable<SafeAreaInsets['insets']>>writable();
export const getInsets = async () => {
  const insetsRes = await SafeArea.getSafeAreaInsets();
  insets.set(insetsRes.insets);
  return insetsRes.insets;
};

export const location = <Writable<Location>>writable();
export const updateCurrentLocation = async () => {
  if (Capacitor.getPlatform() !== 'web') {
    try {
      await Geolocation.checkPermissions();
    } catch {
      await Geolocation.requestPermissions();
    }
    const l = get(location);
    try {
      l.gp = await Geolocation.getCurrentPosition();
    } catch (e) {
      if (
        l.gp ||
        (await Preferences.get({ key: 'location-permissions' })).value == '0'
      )
        return;
      const { value } = await Dialog.confirm({
        title: 'Location Permissions',
        message:
          'FriendsFM needs location services to work correctly. Please enable them in settings.',
        okButtonTitle: 'Settings',
        cancelButtonTitle: 'Ignore',
      });
      await Preferences.set({
        key: 'location-permissions',
        value: value ? '1' : '0',
      });
      if (value) {
        await NativeSettings.open({
          optionIOS: IOSSettings.App,
          optionAndroid: AndroidSettings.ApplicationDetails,
        });
      }
    }
    location.set(l);
  } else {
    location.set({
      gp: {
        coords: {
          latitude: 0,
          longitude: 0,
        },
      },
    } as Location);
  }
};