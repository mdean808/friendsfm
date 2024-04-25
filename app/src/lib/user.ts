import { writable, type Writable } from 'svelte/store';
import type { MusicPlatform, Song, User } from '$lib/types';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { network } from '$lib/util';
import type { AccessToken } from '@spotify/web-api-ts-sdk';

export const user = <Writable<User>>writable();

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

  user.update((u) => {
    u.musicPlatform = newMusicPlatform;
    return u;
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
