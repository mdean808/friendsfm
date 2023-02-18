import type { Adress as Address } from '@capgo/nativegeocoder';

export interface User {
  email?: string;
  displayName?: string;
  photoURL?: string;
  uid: string;
  username?: string;
  musicPlatform?: MusicPlatform;
  friends?: User[];
  submissions?: Submission[];
  savedSongs?: Song[];
  audials?: Audial[];
  messagingToken?: string;
  authToken: string;
  id?: string;
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
  durationElapsed: number; // in seconds
  url: string;
  id: string;
}

export interface Submission {
  id: string;
  user: {
    username: string;
    musicPlatform: MusicPlatform;
  };
  song: Song;
  time: Date;
  audial: Audial;
}

export interface Audial {
  id: string;
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
