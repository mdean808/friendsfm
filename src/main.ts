import './app.css';
import App from './App.svelte';
import { App as CapacitorApp, type URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
// import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
// import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';

import * as Sentry from '@sentry/capacitor';
import * as SentrySvelte from '@sentry/svelte';

import { Capacitor } from '@capacitor/core';
import { getAppCheckToken, initAppCheck, spotifyAuthCode } from './store';

console.log(import.meta.env.npm_packge_version);
// Initialize Sentry
if (import.meta.env.PROD) {
  Sentry.init(
    {
      dsn: 'https://6b81e7dbc9474aa9bb64e2b24652684d@o4504839408844801.ingest.sentry.io/4504839411400704',
      integrations: [new SentrySvelte.BrowserTracing()] as any[],
      // Set your dist version, such as "1"
      dist: '1',
      enableTracing: true,
      tracesSampleRate: 0.25,
      release: 'friendsfm@' + import.meta.env.npm_packge_version,
      environment: 'production',
    },
    SentrySvelte.init
  );
}

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

if (import.meta.env.DEV) {
  (async () => {
    console.log('Setting up emulator');
    await FirebaseAuthentication.useEmulator({
      host: 'http://127.0.0.1',
      port: 9099,
    }).catch(console.log);
  })();
}

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
