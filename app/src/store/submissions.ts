import { action, atom, map } from 'nanostores';
import {
  type StrippedSubmission,
  type Audial,
  type Submission,
  type Comment,
  MusicPlatform,
  type Song,
} from '../types';
import { getFirebaseUrl, handleApiResponse } from '../lib/network';
import { errorToast, goto, showToast } from '../lib/util';
import { appCheckToken, authToken, getNewAuthToken, loading, user } from '.';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { Dialog } from '@capacitor/dialog';
import { Geolocation, type Position } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import AppleMusic, {
  AppleMusicPermissionsResults,
  type AppleMusicSong,
} from '../plugins/AppleMusic';

export const userSubmission = map<Submission>();

export const generateSubmission = action(
  userSubmission,
  'generate-submission',
  async (store) => {
    // set location
    let location: Position;
    try {
      await Geolocation.checkPermissions().catch(
        async () => await Geolocation.requestPermissions()
      );
      location = await Geolocation.getCurrentPosition();
    } catch (e) {
      console.log('Location permissions rejected.');
    }

    let recentlyPlayed: { song: AppleMusicSong };
    if (user.get().musicPlatform === MusicPlatform.appleMusic) {
      // check apple music permissions.
      const perms = await AppleMusic.checkPermissions();
      if (perms.receive !== AppleMusicPermissionsResults.granted) {
        const permsRes = await AppleMusic.requestPermissions();
        if (permsRes.receive !== AppleMusicPermissionsResults.granted) {
          return Dialog.alert({
            message:
              "We can't see what you're listening to! Please allow apple music permissions in settings.",
            title: 'Permissions Denied.',
          });
        }
      }
      try {
        recentlyPlayed = await AppleMusic.getRecentlyPlayed();
      } catch (e) {
        console.log(e);
        return errorToast({ content: e.message });
      }
    }
    const res = await fetch(getFirebaseUrl('createnewusersubmission'), {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
        latitude: location ? location.coords.latitude : undefined,
        longitude: location ? location.coords.longitude : undefined,
        appleMusic: recentlyPlayed?.song as Song,
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
  }
);

export const getSubmissionStatus = action(
  userSubmission,
  'get-submission-status',
  async (store) => {
    await getNewAuthToken();
    const res = await fetch(getFirebaseUrl('getcurrentsubmissionstatus'), {
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
    if (json.message.user) store.set(json.message.user as Submission);
  }
);

export const friendSubmissions = atom<Submission[]>([]);

export const getFriendSubmissions = action(
  friendSubmissions,
  'get-submission-status',
  async (store) => {
    await getNewAuthToken();
    const res = await fetch(getFirebaseUrl('getfriendsubmissions'), {
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
      value: JSON.stringify((json.message.friends as Submission[]) || []),
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
    const res = await fetch(getFirebaseUrl('setcurrentsubmissionaudialscore'), {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
        submissionId: sub.id,
        parsedAudial: { number, score },
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
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
    const musicPlatform = u.get().musicPlatform;
    if (musicPlatform === MusicPlatform.spotify) {
      const { value } = await Dialog.confirm({
        title: 'Create Spotify® Playlist',
        message:
          'This will create a new Spotify® playlist of the songs on your friends submissions each day. Proceed?',
      });
      if (!value) return;
      loading.set(true);
      const res = await fetch(getFirebaseUrl('createsubmissionsplaylist'), {
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
        showToast({ content: 'playlist creation failed. please try again.' });
        return;
      }
      // goto the playlist!
      window.location.href =
        'https://open.spotify.com/playlist/' + json.message;
      showToast({ content: 'playlist successfully created!' });
      return json.message;
    } else if (musicPlatform === MusicPlatform.appleMusic) {
      const { value } = await Dialog.confirm({
        title: 'Create Apple Music Playlist',
        message:
          'This will create a new Apple Music playlist of the songs on your friends submissions each day. Proceed?',
      });
      if (!value) return;
      loading.set(true);
      const { url } = await AppleMusic.createPlaylist({
        name: 'friendsfm - submissions',
      });
      const res = await fetch(getFirebaseUrl('setsubmissionsplaylist'), {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          playlist: url,
        }),
        headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
      });
      const json = await handleApiResponse(res);
      loading.set(false);
      if (!json) {
        //api response failed
        showToast({ content: 'playlist creation failed. please try again.' });
        return;
      }
      // goto playlist
      window.location.href = url;
      showToast({ content: 'playlist successfully created!' });
      return url;
    }
    // return the playlist id
  }
);

export const nearbySubmissions = map<StrippedSubmission[]>([]);

export const getNearbySubmissions = action(
  nearbySubmissions,
  'get-nearbysubmissions',
  async (store, radius?, bounds?) => {
    let location: Position;
    try {
      await Geolocation.checkPermissions().catch(
        async () => await Geolocation.requestPermissions()
      );
      location = await Geolocation.getCurrentPosition();
    } catch (e) {
      console.log('Location permissions rejected.');
    }
    const res = await fetch(getFirebaseUrl('nearbysubmissions'), {
      method: 'post',
      body: JSON.stringify({
        authToken: authToken.get(),
        location: {
          latitude: location ? location.coords.latitude : 0,
          longitude: location ? location.coords.longitude : 0,
        },
        radius,
        bounds,
      }),
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    const data = json.message as StrippedSubmission[];
    store.set(data);
    return data;
  }
);

export const activeSubmission = map<Submission>();

export const createCommentForSubmission = action(
  activeSubmission,
  'create-comment-submission',
  async (store, content: string) => {
    const sub = store.get() as Submission;
    const res = await fetch(getFirebaseUrl('createcomment'), {
      method: 'post',
      body: JSON.stringify({
        authToken: authToken.get(),
        submissionId: sub.id,
        content,
      }),
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    store.set(json.message);
    // update other possible locations for the submission for homepage ui updates
    let fSubs = friendSubmissions.get();
    if (fSubs.find((s) => s.id === sub.id)) {
      fSubs = fSubs.filter((s) => s.id !== sub.id);
      fSubs.push(json.message);
      friendSubmissions.set(fSubs);
    }
    if (sub.id === userSubmission.get().id) userSubmission.set(json.message);
  }
);

export const deleteCommentFromSubmission = action(
  activeSubmission,
  'delete-comment-submission',
  async (store, comment: Comment) => {
    const sub = store.get() as Submission;
    const res = await fetch(getFirebaseUrl('deletecomment'), {
      method: 'post',
      body: JSON.stringify({
        authToken: authToken.get(),
        submissionId: sub.id,
        comment,
      }),
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    store.set(json.message);
    // update other possible locations for the submission for homepage ui updates
    let fSubs = friendSubmissions.get();
    if (fSubs.find((s) => s.id === sub.id)) {
      fSubs = fSubs.filter((s) => s.id !== sub.id);
      fSubs.push(json.message);
      friendSubmissions.set(fSubs);
    }
    if (sub.id === userSubmission.get().id) userSubmission.set(json.message);
  }
);

export const getSubmissionById = action(
  activeSubmission,
  'get-submission-by-id',
  async (store, id: string) => {
    await getNewAuthToken();
    const res = await fetch(getFirebaseUrl('getsubmissionbyid'), {
      method: 'POST',
      body: JSON.stringify({
        id,
        authToken: authToken.get(),
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    store.set(json.message as Submission);
    return json.message as Submission;
  }
);
