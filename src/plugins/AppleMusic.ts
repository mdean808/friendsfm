import { registerPlugin } from '@capacitor/core';

enum PermissionsResults {
  granted = 'granted',
  denied = 'denied',
  prompt = 'prompt',
}

interface AppleMusicSubscriptionStatus {
  canPlayContent: boolean;
  isSubscribed: boolean;
  hasCloudLibraryEnabled: boolean;
}

interface AppleMusicSong {
  name: string;
  artist: string;
  length: number; // in seconds
  // durationElapsed: number; // in seconds
  timestamp: number; // date (milliseconds) when it was played
  url: string;
  id: string;
}

export interface AppleMusicPlugin {
  checkPermissions(): Promise<{ receive: PermissionsResults }>;
  requestPermissions(): Promise<{ receive: PermissionsResults }>;
  getNowPlaying(): Promise<{ song: AppleMusicSong }>;
  getUserSubscriptionStatus(): Promise<AppleMusicSubscriptionStatus>;
}

const AppleMusic = registerPlugin<AppleMusicPlugin>('AppleMusic');

export default AppleMusic;
