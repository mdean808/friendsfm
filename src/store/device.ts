import { map, atom, action } from 'nanostores';
import { SafeArea } from 'capacitor-plugin-safe-area';
import type { Location, ReverseGeolocationPosition } from '../types';
import { NativeGeocoder } from '@capgo/nativegeocoder';
import { Geolocation } from '@capacitor/geolocation';

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

export const bottomInset = atom<number>(0);
export const getBottomInset = action(
  bottomInset,
  'get-bottom-inset',
  async (store) => {
    const insets = await SafeArea.getSafeAreaInsets();
    store.set(insets.insets.bottom);
    return insets.insets.bottom;
  }
);

export const location = map<Location>();
export const updateCurrentLocation = action(
  location,
  'update-location',
  async (store) => {
    try {
      await Geolocation.checkPermissions();
    } catch {
      await Geolocation.requestPermissions();
    }
    const l = store.get();
    l.gp = await Geolocation.getCurrentPosition();
    store.set(l);
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
