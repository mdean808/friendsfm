import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import Submission from '../classes/submission';
import User from '@/classes/user';
import type { Location, Submission as SubmissionType } from '../types';
const db = getFirestore();

export const getNearbySubmissions = async (
  location: Location,
  radius: number = 20
) => {
  const currentNumber = await Submission.getCurrentCount();
  const submissionsRef = db.collection('submissions');
  const bounds = getBoundingBox(location, radius);
  const latQuery = submissionsRef
    .where('location.latitude', '>', bounds.southWest.latitude)
    .where('location.latitude', '<', bounds.northEast.latitude)
    .where('number', '==', currentNumber);
  const lonQuery = submissionsRef
    .where('location.longitude', '>', bounds.southWest.longitude)
    .where('location.longitude', '<', bounds.northEast.longitude)
    .where('number', '==', currentNumber);
  const [latSnapshot, lonSnapshot] = await Promise.all([
    latQuery.get(),
    lonQuery.get(),
  ]);
  const latResults = latSnapshot.docs.map((doc) => doc.id);
  const lonResults = lonSnapshot.docs.map((doc) => doc.id);
  const commonResults = latResults.filter((id) => lonResults.includes(id));
  const results = commonResults.map((id) =>
    latSnapshot.docs.find((doc) => doc.id === id)
  );
  return await Promise.all(
    results
      .filter((doc) => {
        const docLocation = (doc?.data() as SubmissionType).location;
        const distanceInKm = getDistanceInKm(location, docLocation);
        return distanceInKm <= radius;
      })
      .map(async (doc) => {
        const data = doc?.data() as SubmissionType;
        const user = new User(data.userId);
        await user.load();
        data.user = {
          id: user.id,
          username: user.username,
          musicPlatform: user.musicPlatform,
        };
        return data;
      })
  );
};

function getBoundingBox(location: Location, radiusInKm: number) {
  const R = 6371; // Radius of the earth in km
  const lat = deg2rad(location.latitude);
  const lon = deg2rad(location.longitude);
  const dLat = radiusInKm / R;
  const dLon = Math.asin(Math.sin(dLat) / Math.cos(lat));
  const northEast = {
    latitude: rad2deg(lat + dLat),
    longitude: rad2deg(lon + dLon),
  };
  const southWest = {
    latitude: rad2deg(lat - dLat),
    longitude: rad2deg(lon - dLon),
  };
  return { northEast, southWest };
}

function getDistanceInKm(location1: Location, location2: Location) {
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
}

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
