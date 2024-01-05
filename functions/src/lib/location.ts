import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import Submission from '../classes/submission';
import User from '@/classes/user';
import type { Location, Submission as SubmissionType } from '../types';
import { CustomError } from '@/classes/error';
const db = getFirestore();

export const getNearbySubmissions = async (
  location: Location,
  radius: number = 20,
  bounds?: {
    southWest: { latitude: number; longitude: number };
    northEast: { latitude: number; longitude: number };
  }
) => {
  const currentNumber = await Submission.getCurrentCount();
  const submissionsRef = db.collection('submissions');
  if (!bounds && !radius)
    throw new CustomError(
      "Can't find nearby submissions. Missing both bounds and radius."
    );
  if (!bounds) bounds = getBoundingBox(location, Math.floor(radius));
  // Query for submissions within latitude bounds
  const queryLat = submissionsRef
    .where('location.latitude', '>', bounds.southWest.latitude)
    .where('location.latitude', '<', bounds.northEast.latitude)
    .where('number', '==', currentNumber);
  const snapshotLat = await queryLat.get();

  // Query for submissions within longitude bounds
  const queryLong = submissionsRef
    .where('location.longitude', '>', bounds.southWest.longitude)
    .where('location.longitude', '<', bounds.northEast.longitude)
    .where('number', '==', currentNumber);
  const snapshotLong = await queryLong.get();

  // Merge the results
  const resultsLat = snapshotLat.docs.map(
    (doc) => doc?.data() as SubmissionType
  );
  const resultsLong = snapshotLong.docs.map(
    (doc) => doc?.data() as SubmissionType
  );
  const results = resultsLat.filter((resultLat) =>
    resultsLong.some((resultLong) => resultLong.id === resultLat.id)
  );

  return await Promise.all(
    results.map(async (result) => {
      const user = new User(result.userId);
      await user.load();
      result.user = {
        id: user.id,
        username: user.username,
        musicPlatform: user.musicPlatform,
      };
      return result;
    })
  );
};

function getBoundingBox(location: Location, radiusInKm: number) {
  const R = 6371; // Radius of the earth in km
  const lat = deg2rad(location.latitude);
  const lon = deg2rad(location.longitude);
  const dLat = radiusInKm / R;
  let dLon = Math.sin(dLat) / Math.cos(lat);
  const northEast = {
    latitude: rad2deg(lat + dLat),
    longitude: rad2deg(lon + dLon),
  };
  const southWest = {
    latitude: rad2deg(lat - dLat),
    longitude: rad2deg(lon - dLon),
  };

  // Check if any of the bounding box values are NaN
  if (
    isNaN(northEast.latitude) ||
    isNaN(northEast.longitude) ||
    isNaN(southWest.latitude) ||
    isNaN(southWest.longitude)
  ) {
    // Return the bounding box as the width and height of the Earth
    return {
      northEast: { latitude: 90, longitude: 180 },
      southWest: { latitude: -90, longitude: -180 },
    };
  }

  return { northEast, southWest };
}

/*function getDistanceInKm(location1: Location, location2: Location) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(location2.latitude - location1.latitude);
  const dLon = deg2rad(location2.longitude - location1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(location1.latitude)) *
      Math.cos(deg2rad(location2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}*/

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
function rad2deg(rad: number) {
  return rad * (180 / Math.PI);
}

export function getLocationHeaders(req: functions.https.Request): {
  country?: string;
  ip?: string;
} {
  /**
   * Checking order:
   * Cloudflare: in case user is proxying functions through it
   * Fastly: in case user is service functions through firebase hosting (Fastly is the default Firebase CDN)
   * App Engine: in case user is serving functions directly through cloudfunctions.net
   */
  const ip =
    req.header('Cf-Connecting-Ip') ||
    req.header('Fastly-Client-Ip') ||
    req.header('X-Appengine-User-Ip') ||
    req.header('X-Forwarded-For')?.split(',')[0] ||
    req.socket.remoteAddress;

  const country =
    req.header('Cf-Ipcountry') ||
    req.header('X-Country-Code') ||
    req.header('X-Appengine-Country');
  return { ip: ip?.toString(), country: country?.toString() };
}
