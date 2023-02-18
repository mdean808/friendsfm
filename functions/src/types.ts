import type { Timestamp } from 'firebase-admin/firestore';

export interface User {
  email?: string;
  displayName?: string;
  photoURL?: string;
  uid: string;
  username?: string;
  musicPlatform?: MusicPlatform;
  friends?: string[]; // user ids
  submissions?: string[]; // submission ids
  savedSongs?: string[]; // song ids
  audials?: string[]; // audial ids
  messagingToken?: string;
  id: string;
  authToken: string;
}

export enum MusicPlatform {
  spotify = 'spotify',
  appleMusic = 'apple-music',
}

export interface Song {
  name: string;
  artist: string;
  durationElapsed: number; // in seconds
  url: string;
  id?: string;
}

export interface Submission {
  id?: string;
  number: number;
  song: Song; // song id
  time: Date | Timestamp;
  audial: string; // audial id
  user?: {
    username: string;
    musicPlatform: MusicPlatform;
  };
  location: {
    longitude: number;
    latitude: number;
  };
}

export interface Audial {
  id: string;
  number: number;
  score: string;
}

export interface SpotifyAuthRes {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

export interface MusicPlatformAuth {
  access_token: string;
  expires_at: Date | Timestamp;
  refresh_token: string;
}

export interface SpotifyCurrentlyPlayingRes {
  timestamp: number;
  progress_ms: number;
  item: SpotifyTrack;
  is_playing: boolean;
}

export interface SpotifyTrack {
  artists: [
    {
      name: string;
    }
  ];
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  href: string; // api url
  name: string;
  preview_url: string;
}

export interface SpotifyRecentlyPlayedRes {
  href: string;
  items: [
    {
      track: SpotifyTrack;
      played_at: Date;
    }
  ];
}
