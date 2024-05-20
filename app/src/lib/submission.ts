import { get, writable, type Writable } from 'svelte/store';
import {
  type Submission,
  MusicPlatform,
  type Song,
  type StrippedSubmission,
  type Comment,
  type User,
} from '$lib/types';
import { Geolocation, type Position } from '@capacitor/geolocation';
import {
  type AppleMusicSong,
  AppleMusicPermissionsResults,
} from '$plugins/AppleMusic';
import AppleMusic from '$plugins/AppleMusic';
import { Dialog } from '@capacitor/dialog';
import {
  chunkArray,
  currSubNumber,
  errorToast,
  loading,
  network,
  showToast,
} from './util';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { session } from './session';
import {
  FirebaseFirestore,
  type DocumentData,
  type DocumentSnapshot,
  type QueryCompositeFilterConstraint,
} from '@capacitor-firebase/firestore';

export const friendSubmissions = <Writable<Submission[]>>writable([]);

export const nearbySubmissions = <Writable<StrippedSubmission[]>>writable([]);

export const userSubmission = <Writable<Submission>>writable();

export const activeSubmission = <Writable<Submission | null>>writable();

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
  const friendSubs = await loadFriendSubmissions();
  const friends = friendSubs?.map((f) => {
    return {
      id: f.id,
      username: f.user?.username,
      musicPlatform: f.user?.musicPlatform,
    };
  });
  return friends;
};

export const createCommentForSubmission = async (content: string) => {
  const sub = get(activeSubmission);
  const user = get(session).user;
  if (!sub) return;
  const comment = {
    id: Math.random().toString(),
    user: {
      id: user.id,
      username: user.public.username,
    },
    content: content,
  };
  await FirebaseFirestore.updateDocument({
    reference: `submissions/${sub.id}`,
    data: {
      comments: [...sub.comments, comment],
    } as Submission,
  });
};

export const deleteCommentFromSubmission = async (comment: Comment) => {
  const sub = get(activeSubmission);
  if (!sub) return;
  await FirebaseFirestore.updateDocument({
    reference: `submissions/${sub.id}`,
    data: {
      comments: sub.comments.filter((c) => c.id !== comment.id),
    } as Submission,
  });
};

export const loadUserSubmission = async () => {
  const userFilter: QueryCompositeFilterConstraint = {
    type: 'and',
    queryConstraints: [
      {
        type: 'where',
        fieldPath: 'userId',
        opStr: '==',
        value: get(session).user.id,
      },
      {
        type: 'where',
        fieldPath: 'number',
        opStr: '==',
        value: get(currSubNumber),
      },
    ],
  };
  // snapshot user submission status
  const colRes = await FirebaseFirestore.getCollection({
    reference: 'submissions',
    compositeFilter: userFilter,
  });
  const sub = colRes.snapshots[0];
  if (sub?.data) {
    userSubmission.set({
      ...(sub.data as Submission),
      id: sub.id,
      user: {
        id: get(session).user.id,
        username: get(session).user.public.username || '',
        musicPlatform:
          get(session).user.public.musicPlatform || MusicPlatform.spotify,
      },
    });
  } else {
    // user submission doesn't exist
  }
};

export const loadFriendSubmissions = async () => {
  // friend submissions
  const friendIds = get(session).user.friends.map((f) => f.id);

  if (friendIds.length === 0) return;

  const friendIdChunks = chunkArray(friendIds, 30);

  const submissions: Submission[] = [];

  const updateSubmissions = async (docs: DocumentSnapshot<DocumentData>[]) => {
    docs.forEach(async (d) => {
      const userRes = await FirebaseFirestore.getDocument({
        reference: `users/${d.data?.userId}/public/info`,
      });
      const publicUser = userRes.snapshot.data as User['public'];
      const fSub = {
        ...d.data,
        id: d.id,
        user: {
          id: d.data?.userId,
          username: publicUser.username,
          musicPlatform: publicUser.musicPlatform,
        },
      } as Submission;

      submissions.push(fSub);

      friendSubmissions.update((fs) => {
        // remove existing submission instance
        fs = fs.filter((s) => s.id !== fSub.id);
        // add updated submission instance
        fs = [...fs, fSub];
        // complete update
        return fs;
      });
    });
  };

  friendIdChunks.forEach(async (chunk) => {
    const friendSubsFilter: QueryCompositeFilterConstraint = {
      type: 'and',
      queryConstraints: [
        {
          type: 'where',
          fieldPath: 'userId',
          opStr: 'in',
          value: chunk,
        },
        {
          type: 'where',
          fieldPath: 'number',
          opStr: '==',
          value: get(currSubNumber),
        },
      ],
    };

    // Load friend submissions
    const docs = await FirebaseFirestore.getCollection({
      reference: 'submissions',
      compositeFilter: friendSubsFilter,
    });
    await updateSubmissions(docs.snapshots);
  });
  return submissions;
};

export const getSubmission: (id: string) => Promise<Submission | null> = async (
  id: string
) => {
  if (!id) return null;
  // snapshot user submission status
  const sub = await FirebaseFirestore.getDocument({
    reference: `submissions/${id}`,
  });
  if (sub.snapshot.data) {
    const userRes = await FirebaseFirestore.getDocument({
      reference: `users/${sub.snapshot.data?.userId}/public/info`,
    });
    const publicUser = userRes.snapshot.data as User['public'];
    return {
      ...(sub.snapshot.data as Submission),
      id: sub.snapshot.id,
      user: {
        id: sub.snapshot.data.userId,
        username: publicUser.username,
        musicPlatform: publicUser.musicPlatform,
      },
    } as Submission;
  } else {
    return null;
  }
};
