/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capacitor-firebase/authentication" />
/// <reference types="@capacitor-firebase/messaging" />
import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'xyz.mogdan.friendsfm',
  appName: 'friends-fm',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    backgroundColor: '#1f2937',
    scrollEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#1f2937',
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['apple.com', 'google.com'],
    },
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
  },
  // server: {
  //   url: 'http://206.12.66.56:8080/',
  //   cleartext: true,
  // },
};

export default config;
