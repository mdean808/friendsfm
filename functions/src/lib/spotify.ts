import { Timestamp } from 'firebase-admin/firestore';
import {
  MusicPlatformAuth,
  SavedSong,
  Song,
  SpotifyCurrentlyPlayingRes,
  SpotifyPlaylistRes,
  SpotifyRecentlyPlayedRes,
} from '../types';

const SPOTIFY_AUTH = Buffer.from(
  process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
).toString('base64');

export const checkSpotifyAccessCode = async (
  data: MusicPlatformAuth,
  userRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
) => {
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
    const realRes = (await res.json()) as SpotifyCurrentlyPlayingRes;
    if (realRes.timestamp) delete realRes?.timestamp;
    return realRes;
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
    const jsonRes = await res.json();

    const json = jsonRes as SpotifyRecentlyPlayedRes;

    if (!json.items[0]) throw new Error('No recently played songs');

    const currentlyPlaying: SpotifyCurrentlyPlayingRes = {
      timestamp: new Date(json.items[0]?.played_at).getTime(),
      progress_ms: json.items[0]?.track.duration_ms,
      item: json.items[0]?.track,
      is_playing: false,
    };
    return currentlyPlaying;
  }
};

export const getSpotifyUser = async (spotifyAuth: MusicPlatformAuth) => {
  if (!spotifyAuth) throw Error('User not signed into spotify.');
  const res = await fetch('https://api.spotify.com/v1/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + spotifyAuth.access_token,
    },
  });
  if (res.status === 403) {
    throw Error('Spotify 403 Forbidden: Please re-link the Spotify account.');
  } else {
    const json = await res.json();
    return json;
  }
};

export const createSpotifyPlaylist = async (
  spotifyAuth: MusicPlatformAuth,
  songs: SavedSong[] = []
) => {
  if (!spotifyAuth) throw Error('User not signed into spotify.');
  // get user's spotify id from the api
  const spotify_id = (await getSpotifyUser(spotifyAuth)).id;
  // create a new playlist for the user
  const res = await fetch(
    `https://api.spotify.com/v1/users/${spotify_id}/playlists`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + spotifyAuth.access_token,
      },
      body: JSON.stringify({
        name: 'friendsfm saved songs',
        description: 'all the songs liked from friendsfm',
        public: true,
      }),
    }
  );
  if (res.status === 403) {
    throw new Error(
      'Spotify 403 Forbidden: Please re-link the Spotify account.'
    );
  } else {
    const playlist = (await res.json()) as SpotifyPlaylistRes;
    // add the saved songs to the spotify playlist
    // we don't await this iteration because we want to get a response back to hte user ASPA
    for (const song of songs) {
      addSongToSpotifyPlaylist(song, playlist.id, spotifyAuth);
    }
    return playlist.id;
  }
};

export const addSongToSpotifyPlaylist = async (
  song: SavedSong | Song,
  playlistId: string,
  spotifyAuth: MusicPlatformAuth
) => {
  if (!spotifyAuth) throw Error('User not signed into spotify.');
};
