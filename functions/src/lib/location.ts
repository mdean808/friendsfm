import { getFirestore } from 'firebase-admin/firestore';
import Submission from '../classes/submission';
import type { Location, Submission as SubmissionType } from '../types';
const db = getFirestore();

export const getNearbySubmissions = async (
  location: Location,
  radius: number
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
  return results
    .filter((doc) => {
      const docLocation = (doc?.data() as SubmissionType).location;
      const distanceInKm = getDistanceInKm(location, docLocation);
      return distanceInKm <= radius;
    })
    .map((doc) => doc?.data()) as SubmissionType[];
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
