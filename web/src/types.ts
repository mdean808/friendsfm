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
export enum MusicPlatform {
  spotify = 'spotify',
  appleMusic = 'apple-music',
}
export interface UserStatistics {
  topSong: SavedSong;
  submissionCount: number;
  onTimeSubmissionCount: number;
}
export interface UserProfile {
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
}
