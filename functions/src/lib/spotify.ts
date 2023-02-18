import { Timestamp } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import {
  MusicPlatformAuth,
  SpotifyCurrentlyPlayingRes,
  SpotifyRecentlyPlayedRes,
} from '../types';

const SPOTIFY_AUTH = Buffer.from(
  process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
).toString('base64');

export const checkSpotifyAccessCode = async (
  data: MusicPlatformAuth,
  userRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
) => {
  console.log(data);

  data.expires_at = new Timestamp(
    (data.expires_at as Timestamp).seconds,
    (data.expires_at as Timestamp).nanoseconds
  ).toDate();
  if (new Date(data.expires_at) < new Date()) {
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', data.refresh_token);
    const res = await fetch('https://accounts.spotify.com/api/token', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + SPOTIFY_AUTH,
      },
      method: 'POST',
      body,
    });
    if (res.status !== 200) {
      console.error(await res.text());
      throw new Error('Spotify token refresh error.');
    } else {
      const json = await res.json();
      data.access_token = json.access_token;
      const musicPlatformAuth = data;
      await userRef.update({ musicPlatformAuth });
      return data.access_token;
    }
  } else {
    return data.access_token;
  }
};

export const getCurrentSpotifySong = async (accessToken: string) => {
  const res = await fetch(
    'https://api.spotify.com/v1/me/player/currently-playing',
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
    }
  );

  if (res.status !== 200) {
    console.error('get current spotify song: ' + res.status, await res.text());
    if (res.status === 204) {
      return await getRecentlyPlayedSpotifySongs(accessToken);
    }
    throw new Error('Spotify now playing error. ' + res.status);
  } else {
    return (await res.json()) as SpotifyCurrentlyPlayingRes;
  }
};

export const getRecentlyPlayedSpotifySongs = async (accessToken: string) => {
  const res = await fetch(
    'https://api.spotify.com/v1/me/player/recently-played?limit=1',
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
    }
  );

  if (res.status !== 200) {
    console.error(
      'get recently played spotify songs: ' + res.status,
      await res.text()
    );
    throw new Error('Spotify recent songs error.');
  } else {
    const json = (await res.json()) as SpotifyRecentlyPlayedRes;

    functions.logger.info(json);

    const currentlyPlaying: SpotifyCurrentlyPlayingRes = {
      timestamp: new Date(json.items[0].played_at).getMilliseconds(),
      context: {
        external_urls: {
          spotify: json.items[0].context.external_urls.spotify,
        },
        href: json.items[0].context.href, // api url
        type: json.items[0].context.type,
      },
      progress_ms: json.items[0].track.duration_ms,
      item: json.items[0].track,
      is_playing: false,
    };
    return currentlyPlaying;
  }
};
