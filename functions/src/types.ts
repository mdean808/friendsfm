import type { Timestamp } from 'firebase-admin/firestore';

export interface User {
  registered?: boolean;
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
  duration: number; // in seconds
  id: string;
}

export interface Submission {
  id: string;
  user: User;
  song: string; // song id
  time: Date | Timestamp;
  audial: string; // audial id
}

export interface Audial {
  id: string;
  number: number;
  score: string;
}
