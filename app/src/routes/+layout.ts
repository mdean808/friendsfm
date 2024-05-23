import { browser, dev } from '$app/environment';
import { goto } from '$app/navigation';
import { insets } from '$lib/device';
import { setupSnapshots } from '$lib/firebase';
import { authSession, endSession, loadSession, session } from '$lib/session';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';
import {
  appLoaded,
  initParams,
  notificationState,
  publicProfileUsername,
} from '$lib/util';
import { page } from '$app/stores';
import { activeSubmission, getSubmission } from '$lib/submission';
import { Capacitor } from '@capacitor/core';
import { App, type URLOpenListenerEvent } from '@capacitor/app';
import {
  refreshMessagingToken,
  spotifyAuthCode,
  updateMusicPlatform,
} from '$lib/user';
import { MusicPlatform } from '$lib/types';

export const ssr = false;
export const prerender = true;

export const load: LayoutLoad = ({ url }) => {
  return {
    url: url.pathname,
  };
};

let snapshotsInit = false;
const setupDevice = async () => {
  // setup notifications
  if (Capacitor.isPluginAvailable('FirebaseMessaging')) {
    // listen for a new token
    FirebaseMessaging.addListener('tokenReceived', async ({ token }) => {
      if (!get(session)?.user?.id) return;
      await refreshMessagingToken(token);
    });
    // listen for a new notification
    await FirebaseMessaging.addListener(
      'notificationActionPerformed',
      (action) => {
        notificationState.set(action);
      }
    );
    // remove notification bubble on app launch
    if (Capacitor.getPlatform() !== 'web')
      FirebaseMessaging.removeAllDeliveredNotifications();
  }
  // device specific layout logic
  const is = await SafeArea.getSafeAreaInsets();
  insets.set(is.insets);
};

const setupQueriesAndDeeplinks = () => {
  // setup for deep links and query parameters
  if (window.location.search)
    initParams.set(new URLSearchParams(window.location.search));
  App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const url = new URL(event.url);
    if (url.pathname.includes('spotify')) {
      const spotifyAccessCode = url.searchParams.get('code');
      spotifyAuthCode.set(spotifyAccessCode || '');
    }
    if (url.pathname.includes('user')) {
      if (
        !get(session).loggedIn ||
        !get(session).user.public.username ||
        !get(session).user.public.username
      )
        return;
      const username = url.pathname.split('/')[2];
      publicProfileUsername.set(username);
      goto('/modal/public');
    }
  });
};

const setupSessionsAndAuth = async () => {
  // user auth logic
  session.update((s) => ({ ...s, loaded: false }));
  FirebaseAuthentication.addListener('authStateChange', async (state) => {
    if (state.user) {
      if (get(session).loggedIn) return;
      await authSession(state.user);
      if (!snapshotsInit) {
        await setupSnapshots().catch(async (e) => {
          if (e.message.includes('Missing or insufficient permissions')) {
            await FirebaseAuthentication.signOut();
            await endSession();
            goto('/intro/login');
          } else {
            console.log(
              'load (listener): snapshot setup error',
              e,
              get(session)
            );
          }
        });
        snapshotsInit = true;
      }
    } else {
      goto('/intro/login');
    }
    // check for music platform authentication on web only after authenticating
    const platform = get(initParams)?.get('auth');
    if (platform === MusicPlatform.spotify) {
      if (
        await updateMusicPlatform(
          MusicPlatform.spotify,
          get(initParams).get('code') || ''
        )
      )
        goto('/main/home');
    }
    appLoaded.set(true);
  });
  // init session
  await loadSession();
  if (get(session).loggedIn) {
    if (!snapshotsInit) {
      // make sure we have a auth session saved
      await setupSnapshots().catch(async (e) => {
        if (e.message.includes('Missing or insufficient permissions') || dev) {
          await FirebaseAuthentication.signOut();
          await endSession();
          goto('/intro/login');
        } else {
          console.log('load: snapshot setup error', e, get(session));
        }
      });
      snapshotsInit = true;
    }
    // check for music platform authentication on web only after authenticating
    const platform = get(initParams)?.get('auth');
    if (platform === MusicPlatform.spotify) {
      if (
        await updateMusicPlatform(
          MusicPlatform.spotify,
          get(initParams).get('code') || ''
        )
      )
        goto('/main/home');
    }
    appLoaded.set(true);
  } else {
    goto('/intro/login');
  }
};

const setupNavigationLogic = async () => {
  // handle dynamic pages
  if (get(page).route.id?.includes('modal/profile')) {
    const username = get(page).url.searchParams.get('user') || '';
    if (!username) goto('/main/home');
    publicProfileUsername.set(username);
  }
  if (get(page).route.id?.includes('modal/submission')) {
    const subId = get(page).url.searchParams.get('id') || '';
    if (!subId) goto('/main/home');
    const submission = await getSubmission(subId);
    activeSubmission.set(submission);
  }
};

// page load setup
if (browser) {
  setupQueriesAndDeeplinks();
  (async () => {
    await setupDevice();
    await setupSessionsAndAuth();
    await setupNavigationLogic();
    appLoaded.set(true);
  })();
}
