import { Preferences } from '@capacitor/preferences';
import { updateCurrentLocation } from './device';

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
  //todo: write firebase function to get nearby submissions
};
