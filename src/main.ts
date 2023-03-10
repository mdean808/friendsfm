import './app.css';
import App from './App.svelte';
import { App as CapacitorApp, type URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
// import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { Capacitor } from '@capacitor/core';
import { spotifyAuthCode } from './store';

// Initialize Firebase
FirebaseAnalytics.setEnabled({ enabled: true });

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
