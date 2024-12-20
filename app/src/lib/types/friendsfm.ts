import type { AudialAttempt } from "./audial";

export enum UserState {
  unregistered = 'unregistered',
  registered = 'registered',
  registeringUsername = 'registering-username',
  registeringMusicPlatform = 'registering-music-platform',
}

export interface Toast {
  visible: boolean;
  content?: string;
  color?: string;
  duration?: number;
  offset?: number;
  onClick?: () => void;
}

export interface User {
  id: string;
  // secure parameters
  messagingToken?: string;
  email: string;
  // private parameters
  likedSongsPlaylist?: string;
  submissionsPlaylist?: string;
  friends: Friend[];
  friendRequests: string[]; // usernames
  //public parameters
  // this is in the database under /{user_id}/public/info
  public: {
    username?: string;
    musicPlatform?: MusicPlatform;
    savedSongs?: SavedSong[];
    profile: {
      bio?: string;
      avatarString?: string;
      stats: UserStatistics;
      musicPlatform?: MusicPlatform;
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
  };
}

export interface UserStatistics {
  topSong?: SavedSong;
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
  MusicPlatform = 'MusicPlatform',
}

export interface Song {
  name: string;
  artist: string;
  length: number; // in seconds
  durationElapsed: number; // in seconds
  timestamp: number; // date (milliseconds) when it was played
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
  audial: AudialAttempt;
  currentlyListening?: Song;
  caption?: string;
  likes: { id: string; username: string }[];
}

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
  };
  content: string;
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
  audial: AudialAttempt;
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

export interface NetworkRequest {
  id: number;
  url: string;
  request?: Request;
  response?: Response;
  abortController: AbortController;
  body: object;
  attempts?: number;
  [key: string]: any;
}

export enum NotificationType {
  FriendRequestCreated = 'request-create',
  FriendRequestAccepted = 'request-accept',
  Daily = 'daily',
  Comment = 'comment',
  LateSubmission = 'late-submission',
}
