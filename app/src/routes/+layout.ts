import { browser, dev } from '$app/environment';
import { goto } from '$app/navigation';
import { insets } from '$lib/device';
import { setupSnapshots } from '$lib/firebase';
import {
  authSession,
  endSession,
  loadSession,
  session,
} from '$lib/session';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';
import { appLoaded, initParams, publicProfileUsername } from '$lib/util';
import { page } from '$app/stores';
import { activeSubmission, getSubmission } from '$lib/submission';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { refreshMessagingToken, updateMusicPlatform } from '$lib/user';
import { MusicPlatform, NotificationType } from '$lib/types';

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
      async (action) => {
        console.log('notificationactionpreformed', action);
        // make sure the app is fully loaded before running the handler
        if (!get(appLoaded)) {
          await new Promise<void>((resolve) => {
            App.addListener('resume', async () => {
              resolve();
            });
          })
        }
        const sesh = get(session)
        const notification = action?.notification
        if (notification && sesh.loaded && sesh.loggedIn) {
          const data = notification.data as {
            [key: string]: any;
            type: NotificationType;
          };
          FirebaseAnalytics.logEvent({
            name: 'notification_open',
            params: {
              title: notification.title,
              body: notification.body,
              subtitle: notification.subtitle,
              id: data.id,
              type: data.type,
            },
          });
          // handle notification actions and subsequente routing
          switch (data.type) {
            case NotificationType.Daily:
              goto('/main/home');
              break;
            case NotificationType.LateSubmission:
              goto('/main/home');
              break;
            case NotificationType.Comment:
              const sub = await getSubmission(data.id);
              activeSubmission.set(sub);
              if (sub) goto('/modal/submission');
              break;
            case NotificationType.FriendRequestCreated:
              goto('/modal/friends');
              break;
            case NotificationType.FriendRequestAccepted:
              goto('/modal/friends');
              break;
            default:
              break;
          }
        }
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
      let redirectUrl =
        Capacitor.getPlatform() === 'web'
          ? `${import.meta.env.VITE_SPOTIFY_REDIRECT_URL}?auth=spotify`
          : import.meta.env.VITE_SPOTIFY_REDIRECT_URL;
      if (dev) redirectUrl = window.location.origin + '?auth=spotify';
      if (
        await updateMusicPlatform(
          MusicPlatform.spotify,
          get(initParams).get('code') || '',
          redirectUrl
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
      let redirectUrl =
        Capacitor.getPlatform() === 'web'
          ? `${import.meta.env.VITE_SPOTIFY_REDIRECT_URL}?auth=spotify`
          : import.meta.env.VITE_SPOTIFY_REDIRECT_URL;
      if (dev) redirectUrl = window.location.origin + '?auth=spotify';
      if (
        await updateMusicPlatform(
          MusicPlatform.spotify,
          get(initParams).get('code') || '',
          redirectUrl
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
