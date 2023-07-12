import { Timestamp } from 'firebase-admin/firestore';

export interface User {
  email: string;
  likedSongsPlaylist?: string;
  submissionsPlaylist?: string;
  musicPlatformAuth: MusicPlatformAuth;
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
  genre: string;
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
  userId: string;
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
  album: any;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  id: string;
  uri: string;
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

export interface SpotifySearchRes {
  tracks: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyTrack[];
  };
  artists: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyTrack[];
  };
  playlists: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyTrack[];
  };
  shows: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyTrack[];
  };
  episodes: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyTrack[];
  };
  albums: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyTrack[];
  };
  audiobooks: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyTrack[];
  };
}

export interface SpotifyPlaylistRes {
  collaborative: boolean;
  description: string;
  external_urls: {
    spotify: string;
  };
  followers: {
    href: string;
    total: number;
  };
  href: string;
  id: string;
  images: [
    {
      url: string;
      height: number;
      width: number;
    }
  ];
  name: string;
  owner: {
    external_urls: {
      spotify: string;
    };
    followers: {
      href: string;
      total: number;
    };
    href: string;
    id: string;
    type: string;
    uri: string;
    display_name: string;
  };
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: [
      {
        added_at: Date;
        added_by: {
          external_urls: {
            spotify: string;
          };
          followers: {
            href: string;
            total: number;
          };
          href: string;
          id: string;
          type: string;
          uri: string;
        };
        is_local: true;
        track: SpotifyTrack[];
      }
    ];
  };
  type: string;
  uri: string;
}
