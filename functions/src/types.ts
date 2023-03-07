import { Timestamp } from 'firebase-admin/firestore';

export interface User {
  email: string;
  displayName?: string;
  photoURL?: string;
  uid: string;
  username: string;
  musicPlatform?: MusicPlatform;
  friends: Friend[];
  friendRequests: string[]; // usernames
  submissions?: string[]; // submission ids
  savedSongs?: string[]; // song ids
  audials?: string[]; // audial ids
  messagingToken?: string;
  id: string;
  authToken: string;
}

export interface Friend {
  username: string;
  id: string;
}

export enum MusicPlatform {
  spotify = 'spotify',
  appleMusic = 'apple-music',
}

export interface Song {
  name: string;
  artist: string;
  length: number; // in seconds
  durationElapsed: number; // in seconds
  timestamp?: number; // the time the song was played in milliseconds
  url: string;
  id: string;
}

export interface SavedSong extends Song {
  user: {
    id: string;
    username: string;
  };
}

export interface Submission {
  id?: string;
  number: number;
  late: boolean;
  song: Song; // song id
  time: Date | Timestamp;
  audial: Audial;
  user?: {
    username: string;
    musicPlatform: MusicPlatform;
    id: string;
  };
  location: {
    longitude: number;
    latitude: number;
  };
  lateTime: Date | Timestamp;
}

export interface Audial {
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
  timestamp?: number;
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
