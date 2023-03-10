import './app.css';
import App from './App.svelte';
import { App as CapacitorApp, type URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
// import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
// import { getAnalytics } from 'firebase/analytics';
import { spotifyAuthCode } from './store';

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBefRKyQloI4sGF-WRWkSTgZw1TSb5dz-g',
  authDomain: 'friendsfm.firebaseapp.com',
  databaseURL: 'https://friendsfm-default-rtdb.firebaseio.com',
  projectId: 'friendsfm',
  storageBucket: 'friendsfm.appspot.com',
  messagingSenderId: '611764643709',
  appId: '1:611764643709:web:5356e1828d9a0f46348e14',
  measurementId: 'G-6RD7JFYB8D',
};
initializeApp(firebaseConfig);

FirebaseAnalytics.setEnabled({ enabled: true });

// use emulator for auth if on dev

// Initialize Status Bar
if (Capacitor.isPluginAvailable('StatusBar'))
  StatusBar.setStyle({ style: Style.Dark });
// Force a crash
// FirebaseCrashlytics.crash();

// Initialize Svelte
const app = new App({
  target: document.getElementById('app'),
});

// Handle deeplinks

CapacitorApp.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
  const url = new URL(event.url);
  if (url.pathname.includes('spotify-login')) {
    const spotifyAccessCode = url.searchParams.get('code');
    spotifyAuthCode.set(spotifyAccessCode);
  }
  if (url.pathname.includes('apple-music-login')) {
  }
});

export default app;
