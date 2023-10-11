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
  profile: {
    bio?: string;
    avatarString?: string;
    favorites?: {
      album?: {
        artwork: string;
        name: string;
        artist: string;
        url: string;
      };
      artist?: {
        artwork: string;
        name: string;
        url: string;
      };
      song?: {
        artwork: string;
        name: string;
        artist: string;
        url: string;
      };
    };
  };
}

export interface UserStatistics {
  topSong: Song;
  submissionCount: number;
  onTimeSubmissionCount: number;
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
  albumArtwork?: string;
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
    musicPlatform?: MusicPlatform;
    id: string;
  };
  comments: Comment[];
  location: Location;
  lateTime: Date | Timestamp;
  userId: string;
}

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
  };
  content: string;
}

export interface Location {
  longitude: number;
  latitude: number;
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
  album: {
    id: string;
    images: [
      {
        url: string;
        height: number;
        width: number;
      }
    ];
  };
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
  tracks?: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyTrack[];
  };
  artists?: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyArtist[];
  };
  albums?: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyAlbum[];
  };
  playlists?: {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: SpotifyPlaylist[];
  };
}

export interface SpotifyPlaylist {
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
    total: number;
  };
  type: string;
  uri: string;
}

export interface SpotifyPlaylistRes extends SpotifyPlaylist {
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
}

export interface SpotifyAlbum {
  album_type: string;
  total_tracks: number;
  available_markets: string[];
  external_urls: {
    spotify: string;
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
  release_date: string;
  release_date_precision: string;
  restrictions: {
    reason: string;
  };
  type: string;
  uri: string;
  artists: [
    {
      external_urls: {
        spotify: string;
      };
      href: string;
      id: string;
      name: string;
      type: string;
      uri: string;
    }
  ];
}

export interface SpotifyArtist {
  external_urls: {
    spotify: string;
  };
  followers: {
    href: string;
    total: 0;
  };
  genres: string[];
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
  popularity: 0;
  type: string;
  uri: string;
}
