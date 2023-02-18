import { MusicPlatformAuth, SpotifyCurrentlyPlayingRes } from '../types';

const SPOTIFY_AUTH = Buffer.from(
  process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
).toString('base64');

export const checkSpotifyAccessCode = async (
  data: MusicPlatformAuth,
  userRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
) => {
  console.log(data);
  if (new Date(data.expires_at) < new Date()) {
    //todo: refresh the token!
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
    console.error(await res.text());
    throw new Error('Spotify now playing error.');
  } else {
    return (await res.json()) as SpotifyCurrentlyPlayingRes;
  }
};
