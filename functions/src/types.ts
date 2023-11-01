import { Timestamp } from 'firebase-admin/firestore';

export interface User {
  email: string;
  likedSongsPlaylist?: string;
  submissionsPlaylist?: string;
  musicPlatformAuth: MusicPlatformAuth;
  displayName?: string;
  photoURL?: string;
  username: string;
  musicPlatform?: MusicPlatform;
  friends: Friend[];
  friendRequests: string[]; // usernames
  submissions?: string[]; // submission ids
  savedSongs?: SavedSong[]; // song ids
  audials?: string[]; // audial ids
  messagingToken?: string;
  id: string;
  authToken: string;
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
  id: string; // platform id of the user that submitted this song
  url: string;
  name: string;
  genre: string;
  platforms: {
    id: MusicPlatform;
    url: string;
    name: string;
    artist: string;
    albumArtwork?: string;
  }[];
  artist: string;
  albumArtwork?: string;
  length: number; // song length in seconds
  // submission-specific things
  durationElapsed: number; // time song has been played for in seconds
  timestamp?: number; // the date the song was played in milliseconds
}

export interface SavedSong extends Song {
  user: {
    id: string;
    username: string;
    musicPlatform?: MusicPlatform;
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
