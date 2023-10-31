import { registerPlugin } from '@capacitor/core';

export enum AppleMusicPermissionsResults {
  granted = 'granted',
  denied = 'denied',
  prompt = 'prompt',
}

interface AppleMusicSubscriptionStatus {
  canPlayContent: boolean;
  isSubscribed: boolean;
  hasCloudLibraryEnabled: boolean;
}

export interface AppleMusicSong {
  name: string;
  artist: string;
  length: number; // in seconds
  durationElapsed: number; // in seconds
  timestamp: number; // date (milliseconds) when it was played
  albumArtWork: string;
  genre: string;
  url: string;
  id: string;
}

export interface AppleMusicPlugin {
  checkPermissions(): Promise<{ receive: AppleMusicPermissionsResults }>;
  requestPermissions(): Promise<{ receive: AppleMusicPermissionsResults }>;
  getRecentlyPlayed(): Promise<{ song: AppleMusicSong }>;
  getUserSubscriptionStatus(): Promise<AppleMusicSubscriptionStatus>;
  createPlaylist(options: { name: string }): Promise<{ id: string }>;
}

const AppleMusic = registerPlugin<AppleMusicPlugin>('AppleMusic');

export default AppleMusic;
