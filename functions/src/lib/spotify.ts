import { Timestamp } from 'firebase-admin/firestore';
import {
  MusicPlatformAuth,
  SavedSong,
  Song,
  SpotifyCurrentlyPlayingRes,
  SpotifyPlaylistRes,
  SpotifyRecentlyPlayedRes,
  SpotifySearchRes,
} from '../types';
import { CustomError } from '@/classes/error';
import { SpotifyApi } from '@/classes/SpotifyApi';

export const SPOTIFY_AUTH = Buffer.from(
  process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
).toString('base64');

export const refreshSpotifyAccessCode = async (
  data: MusicPlatformAuth,
  userRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
) => {
  if ((data.expires_at as Timestamp)?.seconds) {
    data.expires_at = new Timestamp(
      (data.expires_at as Timestamp).seconds,
      (data.expires_at as Timestamp).nanoseconds
    ).toDate();
  } else {
    data.expires_at = new Date(data.expires_at as Date);
  }
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
      throw new CustomError('Spotify token refresh error.');
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
    throw new CustomError('Spotify now playing error. ' + res.status);
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
    throw new CustomError('Spotify recent songs error.');
  } else {
    const jsonRes = await res.json();

    const json = jsonRes as SpotifyRecentlyPlayedRes;

    if (!json.items[0]) throw new CustomError('No recently played songs');

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
    throw Error('Spotify 403 Forbidden. Please re-link the Spotify account.');
  } else {
    const json = await res.json();
    return json;
  }
};

export const createSpotifyPlaylist = async (
  spotifyAuth: MusicPlatformAuth,
  songs: SavedSong[] | Song[] = [],
  name: string,
  description: string,
  playlistPublic: boolean = true
) => {
  if (!spotifyAuth) throw Error('User not signed into spotify.');
  // get user's spotify id from the api
  const spotify_id = (await getSpotifyUser(spotifyAuth)).id;
  // create a new playlist for the user
  const res = await fetch(
    `https://api.spotify.com/v1/users/${encodeURI(spotify_id)}/playlists`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + spotifyAuth.access_token,
      },
      body: JSON.stringify({
        name,
        description,
        public: playlistPublic,
      }),
    }
  );
  if (res.status === 403 || res.status === 400) {
    throw new CustomError(
      'Spotify 403 Forbidden: Please re-link the Spotify account.'
    );
  } else {
    const playlist = (await res.json()) as SpotifyPlaylistRes;
    // add the saved songs to the spotify playlist
    // we don't await this iteration because we want to get a response back to hte user ASPA
    await addSongsToSpotifyPlaylist(songs, playlist.id, spotifyAuth);
    return playlist.id;
  }
};

export const addSongsToSpotifyPlaylist = async (
  songs: Song[] | SavedSong[],
  playlistId: string,
  spotifyAuth: MusicPlatformAuth
) => {
  if (!spotifyAuth) throw Error('User not signed into spotify.');
  const songUris = [];
  for (const song of songs) {
    const uri = (await getSpotifySong(song))?.uri;
    songUris.push(uri);
  }
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${encodeURI(
      playlistId
    )}/tracks?uris=${encodeURI(songUris.toString())}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + spotifyAuth.access_token,
      },
    }
  );
  if (res.status === 403) {
    throw new CustomError(
      'Spotify 403 Forbidden: Adding Songs failed. Please re-link the Spotify account.'
    );
  }
};

export const getSpotifySong = async (song: Song | SavedSong) => {
  const spotifyApi = new SpotifyApi(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );
  if (await spotifyApi.isAccessTokenExpired()) {
    await spotifyApi.refreshAccessToken();
  } else {
    await spotifyApi.getAccessToken();
  }
  const res = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURI(
      `track:${song.name} artist:${song.artist}`
    )}`,
    {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + spotifyApi.access_token,
      },
    }
  );
  const json = (await res.json()) as SpotifySearchRes;

  return json.tracks?.items[0];
};

export const removeAllSongsFromSpotifyPlaylist = async (
  playlistId: string,
  spotifyAuth: MusicPlatformAuth
) => {
  const songsRes = await fetch(
    `https://api.spotify.com/v1/playlists/${encodeURI(
      playlistId
    )}/tracks?fields=items(track(uri))`,
    {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + spotifyAuth.access_token,
      },
    }
  );
  if (songsRes.status === 403) {
    throw new CustomError(
      'Spotify 403 Forbidden: Get Songs Failed. Please re-link the Spotify account.'
    );
  }
  const json = (await songsRes.json()) as {
    items: { track: { uri: string } }[];
  };
  const songUris: { uri: string }[] = json.items.map((t) => {
    return {
      uri: t.track.uri,
    };
  });
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${encodeURI(playlistId)}/tracks`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + spotifyAuth.access_token,
      },
      body: JSON.stringify({ tracks: songUris }),
    }
  );
  if (res.status === 403) {
    throw new CustomError(
      'Spotify 403 Forbidden: Delete Songs Failed. Please re-link the Spotify account.'
    );
  }
};

export const removeSongsFromSpotifyPlaylist = async (
  songs: Song[] | SavedSong[],
  playlistId: string,
  spotifyAuth: MusicPlatformAuth
) => {
  if (!spotifyAuth) throw new CustomError('User not signed into spotify.');
  const songUris = [];
  for (const song of songs) {
    const uri = (await getSpotifySong(song))?.uri;
    songUris.push({ uri });
  }

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${encodeURI(playlistId)}/tracks`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + spotifyAuth.access_token,
      },
      body: JSON.stringify({ tracks: songUris }),
    }
  );
  if (res.status === 403) {
    throw new CustomError(
      'Spotify 403 Forbidden: Please re-link the Spotify account.'
    );
  }
};

export const searchSpotify = async (
  query: string,
  types: ('artist' | 'track' | 'playlist' | 'album')[]
): Promise<SpotifySearchRes> => {
  const spotifyApi = new SpotifyApi(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );
  if (await spotifyApi.isAccessTokenExpired()) {
    await spotifyApi.refreshAccessToken();
  } else {
    await spotifyApi.getAccessToken();
  }
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=${types.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + spotifyApi.access_token,
      },
    }
  );
  if (res.status === 403) {
    throw new CustomError(
      'Spotify 403 Forbidden: Please re-link the Spotify account.'
    );
  }
  return await res.json();
};
