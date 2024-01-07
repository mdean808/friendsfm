import type { Adress as Address } from '@capgo/nativegeocoder';
import type SentryTransaction from './lib/SentryTransaction';

export enum UserState {
  unregistered = 'unregistered',
  registered = 'registered',
  registeringUsername = 'registering-username',
  registeringMusicPlatform = 'registering-music-platform',
}

export interface User {
  email: string;
  likedSongsPlaylist?: string;
  submissionsPlaylist?: string;
  displayName?: string;
  photoURL?: string;
  uid: string;
  username: string;
  musicPlatform?: MusicPlatform;
  friends: Friend[];
  friendRequests: string[];
  submissions?: Submission[];
  savedSongs?: SavedSong[];
  audials?: Audial[];
  messagingToken?: string;
  authToken: string;
  id: string;
  profile?: {
    bio?: string;
    avatarString: string;
    stats: UserStatistics;
    musicPlatform: MusicPlatform;
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
  topSong: SavedSong;
  submissionCount: number;
  onTimeSubmissionCount: number;
}

export interface Friend {
  username: string;
  id: string;
}

export interface Location {
  gp: GeolocationPosition;
  rgp: ReverseGeolocationPosition;
}

export interface ReverseGeolocationPosition {
  addresses: Address[];
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
  timestamp?: number; // date (milliseconds) when it was played
  platforms?: {
    id: MusicPlatform;
    url: string;
    name: string;
    artist: string;
    albumArtwork?: string;
  }[];
  albumArtwork?: string;
  genre: string;
  url: string;
  id: string;
}

export interface SavedSong extends Song {
  user: {
    id: string;
    username: string;
    musicPlatform?: MusicPlatform;
  };
}

export interface Submission {
  id: string;
  number: number;
  late?: boolean;
  user: {
    username: string;
    musicPlatform: MusicPlatform;
    id: string;
  };
  location: {
    longitude: number;
    latitude: number;
  };
  song: Song;
  time: Date;
  lateTime: Date;
  comments: Comment[];
  audial: Audial;
}

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
  };
  content: string;
}

export interface Audial {
  number: number;
  score: string;
}

export enum ResponseType {
  error = 'error',
  success = 'success',
}

export interface NetworkResponse {
  type: ResponseType;
  message: string | any;
  error?: string;
}

export interface StrippedSubmission {
  song: Song;
  audial: Audial;
  location: {
    longitude: number;
    latitude: number;
  };
  user: { username: string; id: string; musicPlatform: MusicPlatform };
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
    },
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
      },
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
    },
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
    },
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
    },
  ];
  name: string;
  popularity: 0;
  type: string;
  uri: string;
}

export interface SpotifyTrack {
  artists: [
    {
      name: string;
    },
  ];
  album: {
    id: string;
    images: [
      {
        url: string;
        height: number;
        width: number;
      },
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
export interface MusicKitSearchResponse {
  results: {
    artists: {
      href: string;
      next?: string;
      data: {
        id: string;
        type: string;
        href: string;
        attributes: {
          name: string;
          genreNames: string[];
          artwork: {
            width: number;
            height: number;
            url: string;
            bgColor: string;
            textColor1: string;
            textColor2: string;
            textColor3: string;
            textColor4: string;
          };
          url: string;
        };
        relationships: {
          albums: {
            href: string;
            data: {
              id: string;
              type: string;
              href: string;
            }[];
          };
        };
      }[];
    };
    songs: {
      href: string;
      next?: string;
      data: {
        id: string;
        type: string;
        href: string;
        attributes: {
          albumName: string;
          genreNames: string[];
          trackNumber: number;
          releaseDate: String;
          durationinMillis: number;
          isrc: string;
          artwork: {
            width: number;
            height: number;
            url: string;
            bgColor: string;
            textColor1: string;
            textColor2: string;
            textColor3: string;
            textColor4: string;
          };
          url: string;
          playParams: {
            id: string;
            kind: string;
          };
          discNumber: number;
          isAppleDigitalMaster: boolean;
          hasLyrics: boolean;
          name: string;
          previews: { url: string }[];
          artistName: string;
        };
      }[];
    };
    albums: {
      href: string;
      next?: string;
      data: {
        attributes: {
          name: string;
          artistName: string;
          artwork: {
            width: number;
            height: number;
            url: string;
            bgColor: string;
            textColor1: string;
            textColor2: string;
            textColor3: string;
            textColor4: string;
          };
          trackCount: number;
          playParams: {
            id: string;
            kind: string;
          };
          url: string;
        };
        href: string;
        id: string;
        type: string;
      }[];
    };
  };
}

export interface ActiveRequest {
  url: string;
  transaction: SentryTransaction;
  request?: Request;
  response?: Response;
}
