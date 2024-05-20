import { Preferences } from '@capacitor/preferences';
import { location, updateCurrentLocation } from './device';
import { network } from './util';
import { get } from 'svelte/store';
import type { StrippedSubmission } from './types';
import { nearbySubmissions } from './submission';

const loadNearby = async () => {
  await updateCurrentLocation();
  // grab all submissions for the world if we don't have location permissions
  if ((await Preferences.get({ key: 'location-permissions' })).value === '0')
    await getNearbySubmissions(undefined, {
      southWest: {
        latitude: 80,
        longitude: 180,
      },
      northEast: {
        latitude: -80,
        longitude: -180,
      },
    });
  else await getNearbySubmissions(20);
};

export const getNearbySubmissions = async (
  radius: number = 20,
  bounds?: {
    southWest: { latitude: number; longitude: number };
    northEast: { latitude: number; longitude: number };
  }
) => {
  const message = await network.queryFirebase('nearbysubmissions', {
    location: {
      latitude: get(location)?.gp?.coords
        ? get(location).gp.coords.latitude
        : 0,
      longitude: get(location)?.gp?.coords
        ? get(location).gp.coords.longitude
        : 0,
    },
    radius,
    bounds,
  });
  if (!message) return;
  const data = message as StrippedSubmission[];
  nearbySubmissions.set(data);
  return data;
};
