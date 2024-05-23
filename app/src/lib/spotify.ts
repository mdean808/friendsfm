import { spotifyAuthCode, updateMusicPlatform } from './user';
import { MusicPlatform } from './types';
import { Capacitor } from '@capacitor/core';

export const authenticateWithSpotify = async () => {
  // wait for app to handle universal link with spotify code
  spotifyAuthCode.subscribe(async (value: string) => {
    await updateMusicPlatform(MusicPlatform.spotify, value);
  });
  // send to spotify for authentication
  const redirectUrl =
    Capacitor.getPlatform() === 'web'
      ? `${window.location.origin}?auth=spotify`
      : import.meta.env.VITE_SPOTIFY_REDIRECT_URL;
  const spotifyUrl = `https://accounts.spotify.com/authorize?client_id=${
    import.meta.env.VITE_SPOTIFY_CLIENT_ID
  }&response_type=code&redirect_uri=${redirectUrl}&scope=user-read-currently-playing%20user-read-recently-played%20playlist-modify-private%20playlist-modify-public`;
  window.location.href = spotifyUrl;
};
