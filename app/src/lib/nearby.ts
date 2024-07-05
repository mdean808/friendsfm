import { location } from './device';
import { network } from './util';
import { get } from 'svelte/store';
import type { StrippedSubmission } from './types';
import { nearbySubmissions } from './submission';

export const getNearbySubmissions = async (
  radius: number = 20,
  bounds?: {
    southWest: { latitude: number; longitude: number };
    northEast: { latitude: number; longitude: number };
  }
) => {
  const message = await network.queryFirebase('nearbysubmissions', {
    location: {
      latitude: get(location)?.coords ? get(location).coords.latitude : 0,
      longitude: get(location)?.coords ? get(location).coords.longitude : 0,
    },
    radius,
    bounds,
  });
  if (!message) return;
  const data = message as StrippedSubmission[];
  nearbySubmissions.set(data);
  return data;
};
