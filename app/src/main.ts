import './app.css';
import App from './App.svelte';
import { App as CapacitorApp, type URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { initializeApp } from 'firebase/app';

import * as Sentry from '@sentry/capacitor';
import * as SentrySvelte from '@sentry/svelte';

import { Capacitor } from '@capacitor/core';
import {
  deepLink,
  loggedIn,
  loginState,
  publicProfileUsername,
  spotifyAuthCode,
} from './store';
import { goto } from './lib';
import { UserState } from './types';

// Initialize Sentry
Sentry.init(
  {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new Sentry.BrowserTracing()],
    // Set your dist version, such as "1"
    dist: '1',
    enableTracing: true,
    tracesSampleRate: 0.25,
    tracePropagationTargets: [
      'localhost',
      '127.0.0.1',
      /^https:\/\/.*-tprlxlzyxq-uc\.a\.run\.app/,
    ],
    release: 'friendsfm@' + import.meta.env.npm_packge_version,
    environment:
      import.meta.env.PROD && import.meta.env.RELEASE
        ? 'production'
        : import.meta.env.DEV
        ? 'development'
        : 'staging',
  },
  SentrySvelte.init
);

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

if (import.meta.env.DEV) {
  (async () => {
    console.log('Setting up emulator');
    await FirebaseAuthentication.useEmulator({
      host: 'http://127.0.0.1',
      port: 9099,
    }).catch(console.log);
  })();
}

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
  if (url.pathname.includes('spotify')) {
    const spotifyAccessCode = url.searchParams.get('code');
    spotifyAuthCode.set(spotifyAccessCode);
  }
  if (url.pathname.includes('user')) {
    if (!loggedIn.get() && loginState.get() !== UserState.registered) return;
    deepLink.set(true);
    const username = url.pathname.split('/')[2];
    publicProfileUsername.set(username);
    goto('/public_profile');
  }
});

export default app;
