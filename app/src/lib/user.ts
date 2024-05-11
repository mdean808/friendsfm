import { writable, type Writable } from 'svelte/store';
import type { MusicPlatform, Song } from '$lib/types';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { network } from '$lib/util';
import type { AccessToken } from '@spotify/web-api-ts-sdk';
import { session } from './session';

export const spotifyAuthCode = <Writable<string>>writable();

export const updateMusicPlatform = async (
  newMusicPlatform: MusicPlatform,
  authCode?: string,
  musicPlatformAuth?: AccessToken
) => {
  const message = await network.queryFirebase('setmusicplatform', {
    musicPlatform: newMusicPlatform,
    platformAuthCode: authCode,
    musicPlatformAuth,
  });
  if (!message) return;

  session.update((s) => {
    s.user.public.musicPlatform = newMusicPlatform;
    return s;
  });
  // update state
  FirebaseAnalytics.setUserProperty({
    key: 'musicPlatform',
    value: newMusicPlatform,
  });
  // musuc platform set succeeded!
  return true;
};

export const getCurrentSong = async (
  id: string,
  username?: string
): Promise<Song | undefined> => {
  const message = await network.queryFirebase('getusercurrentlylistening', {
    id,
    username,
  });
  if (!message) return;
  return message;
};
