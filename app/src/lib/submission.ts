import { get, writable, type Writable } from 'svelte/store';
import {
  type Submission,
  MusicPlatform,
  type Song,
  type StrippedSubmission,
} from '$lib/types';
import { doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db, submissionsCollection } from '$lib/firebase';
import { Geolocation, type Position } from '@capacitor/geolocation';
import {
  type AppleMusicSong,
  AppleMusicPermissionsResults,
} from '$plugins/AppleMusic';
import AppleMusic from '$plugins/AppleMusic';
import { Dialog } from '@capacitor/dialog';
import { errorToast, loading, network, showToast } from './util';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { session } from './session';

export const friendSubmissions = <Writable<Submission[]>>writable([]);

export const nearbySubmissions = <Writable<StrippedSubmission[]>>writable([]);

export const userSubmission = <Writable<Submission>>writable();

export const activeSubmission = <Writable<Submission | null>>writable();

export const getUserSubmission = async (): Promise<Submission | undefined> => {
  const currSubNumber = (await getDoc(doc(db, 'misc', 'notifications'))).data()
    ?.count;
  const q = query(
    submissionsCollection,
    where('userId', '==', get(session).user.id),
    where('number', '==', currSubNumber)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;
  return snapshot.docs[0].data() as Submission;
};

export const generateSubmission = async () => {
  // set location
  let location: Position = {} as Position;
  try {
    await Geolocation.checkPermissions().catch(
      async () => await Geolocation.requestPermissions()
    );
    location = await Geolocation.getCurrentPosition();
  } catch (e) {
    console.log('Location permissions rejected.');
  }

  let recentlyPlayed = {} as { song: AppleMusicSong };
  if (get(session).user.public.musicPlatform === MusicPlatform.appleMusic) {
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
    } catch (e: any) {
      console.log(e);
      return errorToast({ content: e.message });
    }
  }
  const message = await network.queryFirebase('createnewusersubmission', {
    latitude: location ? location.coords.latitude : undefined,
    longitude: location ? location.coords.longitude : undefined,
    appleMusic: recentlyPlayed?.song as Song,
  });

  if (!message) return;
  userSubmission.set(message.user as Submission);
  FirebaseAnalytics.logEvent({ name: 'generate_submission' });
};

export const createSubmissionsPlaylist = async () => {
  const musicPlatform = get(session).user.public.musicPlatform;
  if (musicPlatform === MusicPlatform.spotify) {
    const { value } = await Dialog.confirm({
      title: 'Create Spotify® Playlist',
      message:
        'This will create a new Spotify® playlist of the songs on your friends submissions each day. Proceed?',
    });
    if (!value) return;
    loading.set(true);
    const message = await network.queryFirebase('createsubmissionsplaylist');
    loading.set(false);
    if (!message) {
      //api response failed
      showToast({ content: 'Playlist creation failed. Please try again.' });
      return;
    }
    // goto the playlist!
    window.location.href = 'https://open.spotify.com/playlist/' + message;
    showToast({ content: 'playlist successfully created!' });
    return message;
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
    const message = await network.queryFirebase('setsubmissionsplaylist', {
      playlist: url,
    });
    loading.set(false);
    if (!message) {
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
};

export const previewSubmission = async () => {
  let recentlyPlayed: { song: AppleMusicSong } | undefined = undefined;
  if (get(session).user.public.musicPlatform === MusicPlatform.appleMusic) {
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
    } catch (e: any) {
      console.log(e);
      return errorToast({ content: e.message });
    }
  }
  const message = await network.queryFirebase('previewusersubmission', {
    appleMusic: recentlyPlayed?.song as Song,
  });

  if (!message) return;
  FirebaseAnalytics.logEvent({ name: 'preview_submission' });
  return message;
};

export const previewFriendSubmissions = async () => {
  const message = await network.queryFirebase('previewuserfriends');
  if (!message) return;
  return message;
};
