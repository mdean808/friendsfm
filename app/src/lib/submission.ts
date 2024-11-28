import { get, writable, type Writable } from 'svelte/store';
import {
  type Comment,
  MusicPlatform,
  type Song,
  type StrippedSubmission,
  type Submission,
  type User,
} from '$lib/types/friendsfm';
import { Geolocation, type Position } from '@capacitor/geolocation';
import AppleMusic, { AppleMusicPermissionsResults, type AppleMusicSong } from '$plugins/AppleMusic';
import { Dialog } from '@capacitor/dialog';
import { chunkArray, currSubNumber, errorToast, loading, network, showToast, submissionLoaded } from './util';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { session } from './session';
import { type DocumentData, type DocumentSnapshot, FirebaseFirestore } from '@capacitor-firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { friendSubmissionsFilter, userSubmissionFilter } from './filters';
import { saveSong, unsaveSong } from './songs';

export const friendSubmissions = <Writable<Submission[]>>writable([]);

export const nearbySubmissions = <Writable<StrippedSubmission[]>>writable([]);

export const userSubmission = <Writable<Submission | null>>writable();

export const activeSubmission = <Writable<Submission | null>>writable();

export const generateSubmission = async () => {
  // set location
  let location: Position = {} as Position;
  if (Capacitor.getPlatform() !== 'web') {
    try {
      await Geolocation.checkPermissions().catch(
        async () => await Geolocation.requestPermissions(),
      );
      location = await Geolocation.getCurrentPosition();
    } catch (e) {
      console.log('Location permissions rejected.');
    }
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
            'We can\'t see what you\'re listening to! Please allow apple music permissions in settings.',
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
    latitude: location ? location.coords?.latitude : undefined,
    longitude: location ? location.coords?.longitude : undefined,
    appleMusic: recentlyPlayed?.song as Song,
  });

  if (!message) return;
  const sub = message.user;
  sub.lateTime = new Date(sub.lateTime);
  sub.time = new Date(sub.time);
  userSubmission.set(message.user as Submission);
  loadFriendSubmissions();
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

export const previewSubmission = async (): Promise<{
  submission: Submission;
  friends: {
    id: string;
    username: string;
    musicPlatform: MusicPlatform;
  }[];
} | void> => {
  let recentlyPlayed: { song: AppleMusicSong } | undefined = undefined;
  if (get(session).user.public.musicPlatform === MusicPlatform.appleMusic) {
    // check apple music permissions.
    const perms = await AppleMusic.checkPermissions();
    if (perms.receive !== AppleMusicPermissionsResults.granted) {
      const permsRes = await AppleMusic.requestPermissions();
      if (permsRes.receive !== AppleMusicPermissionsResults.granted) {
        return Dialog.alert({
          message:
            'We can\'t see what you\'re listening to! Please allow apple music permissions in settings.',
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
  const sub = message.submission;
  // turn times into timestamps for frontent type safety
  sub.lateTime = new Date(sub.lateTime);
  sub.time = new Date(sub.time);
  FirebaseAnalytics.logEvent({ name: 'preview_submission' });
  message.submission = sub;

  message.friends = [];

  return message;
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
  return comment as Comment;
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

export const loadUserSubmission = async (number?: number) => {
  // snapshot user submission status
  const colRes = await FirebaseFirestore.getCollection({
    reference: 'submissions',
    compositeFilter: userSubmissionFilter(number),
  });
  const sub = colRes.snapshots[0];
  let result: Submission | null = null;
  if (sub?.data) {
    result = {
      ...(sub.data as Submission),
      id: sub.id,
      time: new Date(sub.data.time),
      lateTime: new Date(sub.data.lateTime),
      user: {
        id: get(session).user.id,
        username: get(session).user.public.username || '',
        musicPlatform:
          get(session).user.public.musicPlatform || MusicPlatform.spotify,
      },
    };
  }
  userSubmission.set(result);
  submissionLoaded.set(true);
  return result;
};

// function for appending to submissions
export const updateSubmissions = async (docs: DocumentSnapshot<DocumentData>[]) => {
  const submissions: Submission[] = [];
  for (const d of docs) {
    const publicUserRes = await FirebaseFirestore.getDocument({
      reference: `users/${d.data?.userId}/public/info`,
    });
    const publicUser = publicUserRes.snapshot.data as User['public'];
    const fSub = {
      ...d.data,
      id: d.id,
      time: new Date(d.data?.time),
      lateTime: new Date(d.data?.lateTime),
      user: {
        id: d.data?.userId,
        username: publicUser.username,
        musicPlatform: publicUser.musicPlatform,
      },
    } as Submission;

    // friendSubmissions.update((fs) => {
    //   // remove existing submission instance
    //   fs = fs.filter((s) => s.id !== fSub.id);
    //   // add updated submission instance
    //   fs = [...fs, fSub];
    //   // complete update
    //   return fs;
    // });
    submissions.push(fSub);
  }
  return submissions;
};

export const loadFriendSubmissions = async (number?: number) => {
  if (!number) number = get(currSubNumber)
  let submissions: Submission[] = [];
  const friendIds = get(session).user.friends.map((f) => f.id);
  // no friends, no sense in making the requests
  if (friendIds.length === 0) return submissions;

  // chunk request by friend, since firestore only supports queries with <= 30
  const friendIdChunks = chunkArray(friendIds, 30);


  for (const chunk of friendIdChunks) {
    // Load friend submissions
    const docs = await FirebaseFirestore.getCollection({
      reference: 'submissions',
      compositeFilter: friendSubmissionsFilter(chunk, number),
      queryConstraints: [
        {
          type: 'orderBy',
          fieldPath: 'time',
          directionStr: 'desc'
        }
      ]
    });
    submissions = [...submissions, ...await updateSubmissions(docs.snapshots)];
  }
  friendSubmissions.set(submissions)
  return submissions;
};


export const getSubmission: (id: string) => Promise<Submission | null> = async (
  id: string,
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
      time: new Date(sub.snapshot.data?.time),
      lateTime: new Date(sub.snapshot.data?.lateTime),
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

export const toggleLike = async (submission: Submission) => {
  const sesh = get(session);
  // user hasn't liked the submission yet
  if (!submission.likes.find((l) => l.id === sesh.user.id)) {
    // add the like
    await FirebaseFirestore.updateDocument({
      reference: `submissions/${submission.id}`,
      data: {
        likes: [
          ...submission.likes,
          { id: sesh.user.id, username: sesh.user.public.username },
        ],
      },
    });
    // save the song
    await saveSong({ ...submission.song, user: submission.user });
  } else {
    // remove the like
    await FirebaseFirestore.updateDocument({
      reference: `submissions/${submission.id}`,
      data: {
        likes: submission.likes.filter((l) => l.id !== sesh.user.id),
      },
    });
    // unsave the song
    await unsaveSong({ ...submission.song, user: submission.user });
  }
};
