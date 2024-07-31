import {
  MusicPlatformAuth,
  SavedSong,
  Song,
  SpotifyCurrentlyPlayingRes,
  SpotifyPlaylistRes,
  SpotifyRecentlyPlayedRes,
} from '@/types';
import { CustomError } from './error';

import { type User as SpotifyUser } from '@spotify/web-api-ts-sdk';
import { getSpotifySong } from '@/lib/spotify';
import { Timestamp } from 'firebase-admin/firestore';

export const AUTH_HEADER = Buffer.from(
  process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
).toString('base64');

export class SpotifyUserApi {
  private access_token: string;
  private refresh_token: string;
  private expires_at: Date;

  constructor(
    access_token?: string,
    refresh_token?: string,
    expires_at?: Date
  ) {
    this.access_token = access_token || '';
    this.refresh_token = refresh_token || '';
    this.expires_at = expires_at || new Date();
  }

  public get musicPlatformAuth(): MusicPlatformAuth {
    return {
      access_token: this.access_token,
      refresh_token: this.refresh_token,
      expires_at: this.expires_at,
    };
  }

  public set musicPlatformAuth(auth: MusicPlatformAuth) {
    this.access_token = auth.access_token;
    this.refresh_token = auth.refresh_token;
    if ((auth.expires_at as Timestamp)?.seconds) {
      auth.expires_at = (auth.expires_at as Timestamp).toDate();
    } else {
      auth.expires_at = new Date((auth.expires_at || new Date()) as Date);
    }
    this.expires_at = auth.expires_at;
  }

  public async authenticate(
    code: string,
    redirect_uri: string
  ): Promise<MusicPlatformAuth> {
    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', code);
    if (
      !process.env.SPOTIFY_REDIRECT_URLS?.split(',').find(
        (r) => redirect_uri === r
      )
    )
      throw new CustomError('Invalid Spotify redirect url.');
    body.append('redirect_uri', redirect_uri);

    const res = await fetch('https://accounts.spotify.com/api/token', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + AUTH_HEADER,
      },
      method: 'post',
      body,
    });
    if (res.status !== 200) {
      console.log('Spotify authentication error:', await res.text());
      throw new CustomError('Spotify authentication error.');
    } else {
      const json = await res.json();

      this.access_token = json.access_token;
      this.refresh_token = json.refresh_token;
      this.expires_at = new Date(Date.now() + json.expires_in * 1000);
      return {
        access_token: this.access_token,
        refresh_token: this.refresh_token,
        expires_at: this.expires_at,
      };
    }
  }

  public async refreshToken(): Promise<MusicPlatformAuth> {
    if (!this.refresh_token)
      throw new CustomError('Spotify token refresh error.');
    if (new Date(this.expires_at || 0) < new Date()) {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refresh_token,
      });
      const res = await fetch('https://accounts.spotify.com/api/token', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + AUTH_HEADER, // BASIC type for user refresh
        },
        method: 'POST',
        body,
      });
      if (res.status !== 200) {
        console.log('Spotify token refresh error', await res.text());
        throw new CustomError('Spotify token refresh error.');
      } else {
        const json = await res.json();
        this.access_token = json.access_token;
        this.expires_at = new Date(Date.now() + json.expires_in * 1000);
        // spotify doesn't pass a new refresh token so we don't update it
        return {
          access_token: this.access_token,
          refresh_token: this.refresh_token,
          expires_at: this.expires_at,
        };
      }
    } else {
      return {
        access_token: this.access_token,
        refresh_token: this.refresh_token,
        expires_at: this.expires_at,
      };
    }
  }

  public async getUser(): Promise<SpotifyUser> {
    const res = await this.makeRequest('https://api.spotify.com/v1/me', 'GET');
    const json = await res.json();
    return json;
  }

  public async createPlaylist(
    songs: SavedSong[] | Song[] = [],
    name: string,
    description: string,
    playlistPublic: boolean = true
  ) {
    // get user's spotify id from the api
    const spotify_id = (await this.getUser()).id;
    // create a new playlist for the user
    const res = await this.makeRequest(
      `https://api.spotify.com/v1/users/${encodeURI(spotify_id)}/playlists`,
      'POST',
      new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      { name, description, public: playlistPublic }
    );
    const playlist = (await res.json()) as SpotifyPlaylistRes;
    // add the saved songs to the spotify playlist
    // we don't await this iteration because we want to get a response back to hte user ASPA
    await this.addSongsToPlaylist(songs, playlist.id);
    return playlist.id;
  }

  public async addSongsToPlaylist(
    songs: Song[] | SavedSong[],
    playlistId: string
  ) {
    const songUris = [];
    for (const song of songs) {
      const uri = (await getSpotifySong(song))?.uri;
      songUris.push(uri);
    }
    const params = new URLSearchParams();
    params.append('uris', encodeURI(songUris.toString()));
    await this.makeRequest(
      `https://api.spotify.com/v1/playlists/${encodeURI(playlistId)}/tracks`,
      'POST'
    );
  }

  public async getCurrentlyPlaying(): Promise<SpotifyCurrentlyPlayingRes> {
    const res = await this.makeRequest(
      'https://api.spotify.com/v1/me/player/currently-playing',
      'GET'
    );
    // no song is currently playing
    if (res.status === 204) {
      return await this.getRecentlyPlayed();
    } else {
      const realRes = (await res.json()) as SpotifyCurrentlyPlayingRes;
      if (realRes.timestamp) delete realRes?.timestamp;
      return realRes;
    }
  }

  public async getRecentlyPlayed(limit: number = 1) {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    const res = await this.makeRequest(
      `https://api.spotify.com/v1/me/player/recently-played`,
      'GET',
      undefined,
      undefined,
      params
    );

    const json = (await res.json()) as SpotifyRecentlyPlayedRes;

    if (!json.items[0]) throw new CustomError('No recently played songs');

    const currentlyPlaying: SpotifyCurrentlyPlayingRes = {
      timestamp: new Date(json.items[0]?.played_at).getTime(),
      progress_ms: json.items[0]?.track.duration_ms,
      item: json.items[0]?.track,
      is_playing: false,
    };
    return currentlyPlaying;
  }

  public async removeSongsFromSpotifyPlaylist(
    songs: Song[] | SavedSong[],
    playlistId: string
  ) {
    const songUris = [];
    for (const song of songs) {
      const uri = (await getSpotifySong(song))?.uri;
      songUris.push({ uri });
    }

    await this.makeRequest(
      `https://api.spotify.com/v1/playlists/${encodeURI(playlistId)}/tracks`,
      'DELETE',
      new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      { tracks: songUris }
    );
  }

  private async makeRequest(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    headers: Headers = new Headers(),
    body?: object,
    params?: URLSearchParams,
    attempts?: number
  ): Promise<Response> {
    if (attempts && attempts > 1)
      throw new CustomError('Spotify API Request Failed.');
    headers.append('Authorization', `Bearer ${this.access_token}`);

    const options: RequestInit = {
      method,
      headers,
      body: JSON.stringify(body),
    };

    if (!body) delete options.body;

    const res = await fetch(
      `${url}${params ? '?' + params.toString() : ''}`,
      options
    );

    if (res.status >= 400 && res.status < 500) {
      console.log('Spotify Request Error:', res.status, '-', res.url);
      console.log(await res.text());
      if (res.status == 401) {
        await this.refreshToken();
        return this.makeRequest(url, method, headers, body, params);
      }
    }
    if (res.status >= 500) {
      console.log('Spotify Server Error', await res.text());
    }

    return res;
  }
}
