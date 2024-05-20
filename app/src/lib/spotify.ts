import { dev } from '$app/environment';
import { Capacitor } from '@capacitor/core';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { spotifyAuthCode, updateMusicPlatform } from './user';
import { goto } from '$app/navigation';
import { loading } from './util';
import { MusicPlatform } from './types';

export const authSpotify = async (platform: MusicPlatform) => {
  if (Capacitor.getPlatform() === 'web') {
    SpotifyApi.performUserAuthorization(
      import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      dev
        ? 'http://localhost:8080?auth=spotify'
        : import.meta.env.VITE_SPOTIFY_REDIRECT_URL_WEB,
      [
        'user-read-recently-played',
        'user-read-currently-playing',
        'playlist-modify-public',
        'playlist-modify-private',
      ],
      async (token) => {
        if (await updateMusicPlatform(platform, token.access_token, token))
          goto('/main/home');
        loading.set(false);
      }
    );
  } else {
    spotifyAuthCode.subscribe(async (value: string) => {
      if (await updateMusicPlatform(platform, value)) goto('/main/home');
      loading.set(false);
    });
    const spotifyUrl = `https://accounts.spotify.com/authorize?client_id=${
      import.meta.env.VITE_SPOTIFY_CLIENT_ID
    }&response_type=code&redirect_uri=${
      Capacitor.getPlatform() === 'web'
        ? dev
          ? 'http://localhost:8080?auth=spotify'
          : import.meta.env.VITE_SPOTIFY_REDIRECT_URL_WEB
        : import.meta.env.VITE_SPOTIFY_REDIRECT_URL
    }&scope=user-read-currently-playing%20user-read-recently-played%20playlist-modify-private%20playlist-modify-public`;
    window.location.href = spotifyUrl;
  }
};
