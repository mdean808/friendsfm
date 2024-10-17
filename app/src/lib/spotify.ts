import { spotifyAuthCode, updateMusicPlatform } from './user';
import { MusicPlatform } from './types/friendsfm';
import { Capacitor } from '@capacitor/core';
import { dev } from '$app/environment';

export const authenticateWithSpotify = async () => {
  let redirectUrl =
    Capacitor.getPlatform() === 'web'
      ? `${import.meta.env.VITE_SPOTIFY_REDIRECT_URL}?auth=spotify`
      : import.meta.env.VITE_SPOTIFY_REDIRECT_URL;
  if (dev) redirectUrl = window.location.origin + '?auth=spotify';
  // wait for app to handle universal link with spotify code
  spotifyAuthCode.subscribe(async (value: string) => {
    if (!value) return;
    await updateMusicPlatform(MusicPlatform.spotify, value, redirectUrl);
  });
  // send to spotify for authentication
  const spotifyUrl = `https://accounts.spotify.com/authorize?client_id=${
    import.meta.env.VITE_SPOTIFY_CLIENT_ID
  }&response_type=code&redirect_uri=${redirectUrl}&scope=user-read-currently-playing%20user-read-recently-played%20playlist-modify-private%20playlist-modify-public`;
  window.location.href = spotifyUrl;
};
