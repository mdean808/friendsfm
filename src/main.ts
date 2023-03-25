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
  appId: '1:611764643709:web:d86a26a4918d29f9348e14',
  measurementId: 'G-HQGHCKN11Z',
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

import * as Sentry from '@sentry/svelte';
import { BrowserTracing } from '@sentry/tracing';
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'https://6b81e7dbc9474aa9bb64e2b24652684d@o4504839408844801.ingest.sentry.io/4504839411400704',
    // Set your release version, such as 'getsentry@1.0.0'
    release: `friendsfm@0.0.5`,
    integrations: [new BrowserTracing()] as any[],
    // Set your dist version, such as "1"
    dist: '1',
    tracesSampleRate: 0.25,
  });
}
export default app;
