import { action, atom, map } from 'nanostores';
import type { Submission } from '../types';
import { Geolocation } from '@capacitor/geolocation';
import { handleApiResponse } from '../lib';
import { authToken } from '.';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

export const userSubmission = map<Submission>();

export const generateSubmission = action(
  userSubmission,
  'generate-submission',
  async (store) => {
    let location: GeolocationPosition;
    try {
      await Geolocation.requestPermissions();
      location = await Geolocation.getCurrentPosition();
    } catch (e) {
      console.log(e);
    }
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/createNewUserSubmission',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          latitude: location ? location.coords.latitude : undefined,
          longitude: location ? location.coords.longitude : undefined,
        }),
      }
    );
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    store.set(json.message.user as Submission);
    friendSubmissions.set(json.message.friends as Submission[]);
    FirebaseAnalytics.logEvent({ name: 'generate-submission' });
  }
);

export const friendSubmissions = atom<Submission[]>([]);

export const getSubmissionStatus = action(
  friendSubmissions,
  'get-submission-status',
  async (store) => {
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/getCurrentSubmissionStatus',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
        }),
      }
    );
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    store.set(json.message.friends as Submission[]);
    if (json.message.user) userSubmission.set(json.message.user as Submission);
  }
);
