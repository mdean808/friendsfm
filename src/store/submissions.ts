import { action, atom, map } from 'nanostores';
import type { Audial, Submission } from '../types';
import { goto, handleApiResponse } from '../lib';
import {
  appCheckToken,
  authToken,
  FIREBASE_URL,
  getNewAuthToken,
  loading,
  user,
} from '.';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { Dialog } from '@capacitor/dialog';
import { toast } from '@zerodevx/svelte-toast';
import { Geolocation, type Position } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';

export const userSubmission = map<Submission>();

export const generateSubmission = action(
  userSubmission,
  'generate-submission',
  async (store) => {
    try {
      let location: Position;
      try {
        await Geolocation.checkPermissions().catch(
          async () => await Geolocation.requestPermissions()
        );
        location = await Geolocation.getCurrentPosition();
      } catch (e) {
        console.log('Location permissions rejected.');
      }
      const res = await fetch(FIREBASE_URL.get() + '/createNewUserSubmission', {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          latitude: location ? location.coords.latitude : undefined,
          longitude: location ? location.coords.longitude : undefined,
        }),
        headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
      });
      const json = await handleApiResponse(res);
      if (!json) {
        // failed to set new music platform
        return false;
      }
      store.set(json.message.user as Submission);
      FirebaseAnalytics.logEvent({ name: 'generate_submission' });
      // await Preferences.set({
      //   key: 'submission',
      //   value: JSON.stringify(userSubmission.get() || {}),
      // });
    } catch (e) {
      console.log(e);
    }
  }
);

export const getSubmissionStatus = action(
  userSubmission,
  'get-submission-status',
  async (store) => {
    await getNewAuthToken();
    const res = await fetch(
      FIREBASE_URL.get() + '/getCurrentSubmissionStatus',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
        }),
        headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
      }
    );
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    if (json.message.user) store.set(json.message.user as Submission);
    // await Preferences.set({
    //   key: 'submission',
    //   value: JSON.stringify(userSubmission.get() || {}),
    // });
  }
);

export const friendSubmissions = atom<Submission[]>([]);

export const getFriendSubmissions = action(
  friendSubmissions,
  'get-submission-status',
  async (store) => {
    await getNewAuthToken();
    const res = await fetch(FIREBASE_URL.get() + '/getFriendSubmissions', {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    store.set(json.message.friends as Submission[]);
    await Preferences.set({
      key: 'friend-submissions',
      value: JSON.stringify(friendSubmissions.get() || []),
    });
  }
);

export const shareAudial = action(
  userSubmission,
  'share-submission-audial',
  async (store, audial: string | Audial) => {
    const sub = store.get();
    loading.set(true);
    let number: number;
    let score: string;
    if (typeof audial !== 'string') {
      number = audial.number;
      score = audial.score;
    } else {
      const split = audial.split('\n');
      number = parseInt(split[0].split('#')[1]) as number;
      score = split[1] ? split[1] : audial;
    }
    const res = await fetch(
      FIREBASE_URL.get() + '/setCurrentSubmissionAudialScore',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          submissionId: sub.id,
          parsedAudial: { number, score },
        }),
        headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
      }
    );
    const json = await handleApiResponse(res);
    loading.set(false);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    sub.audial = { number, score };
    store.set(sub);
    // await Preferences.set({
    //   key: 'submission',
    //   value: JSON.stringify(userSubmission.get() || {}),
    // });
    goto('/');
  }
);

export const createSubmissionsPlaylist = action(
  user,
  'create-submissions-playlist',
  async (u) => {
    if (u.get().submissionsPlaylist) {
      window.location.href =
        'https://open.spotify.com/playlist/' + u.get().submissionsPlaylist;
      return;
    }
    const { value } = await Dialog.confirm({
      title: 'Create Spotify Playlist',
      message:
        'This will create a new spotify playlist of the songs on your friends submissions each day. Proceed?',
    });
    if (!value) return;
    loading.set(true);
    const res = await fetch(FIREBASE_URL.get() + '/createSubmissionsPlaylist', {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    loading.set(false);
    if (!json) {
      //api response failed
      toast.push('playlist creation failed. please try again.');
      return;
    }
    // goto the playlist!
    window.location.href = 'https://open.spotify.com/playlist/' + json.message;
    // return the playlist id
    toast.push('playlist successfully created!');
    return json.message;
  }
);
