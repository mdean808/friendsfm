import { browser, dev } from '$app/environment';
import { goto } from '$app/navigation';
import { insets } from '$lib/device';
import { setupSnapshots } from '$lib/firebase';
import { authSession, endSession, loadSession, session } from '$lib/session';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';
import { appLoaded, initParams, loadingFriendSubmissions, prevPath, publicProfileUsername } from '$lib/util';
import { page } from '$app/stores';
import {
  activeSubmission,
  friendSubmissions,
  getSubmission,
  userSubmission,
} from '$lib/submission';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { refreshMessagingToken, updateMusicPlatform } from '$lib/user';
import { MusicPlatform, NotificationType } from '$lib/types/friendsfm';

export const ssr = false;
export const prerender = true;

export const load: LayoutLoad = ({ url }) => {
  return {
    url: url.pathname,
  };
};

let snapshotsInit = false;

const musicPlatformInit = async () => {
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
        redirectUrl,
      )
    )
      await goto('/main/home');
  }
}

const setupDevice = async () => {
  // setup notifications
  if (Capacitor.isPluginAvailable('FirebaseMessaging')) {
    // listen for a new token
    await FirebaseMessaging.addListener('tokenReceived', async ({ token }) => {
      if (!get(session)?.user?.id) return;
      await refreshMessagingToken(token);
    });
    // listen for a new notification
    await FirebaseMessaging.addListener(
      'notificationActionPerformed',
      async (action) => {
        // make sure the app is fully loaded before running the handler
        if (!get(appLoaded)) {
          await new Promise<void>((resolve) => {
            App.addListener('resume', async () => {
              resolve();
            });
          });
        }
        const sesh = get(session);
        const notification = action?.notification;
        if (notification && sesh.loaded && sesh.loggedIn) {
          const data = notification.data as {
            [key: string]: any;
            type: NotificationType;
          };
          // noinspection ES6MissingAwait
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
          // handle notification actions and subsequent routing
          // make sure to set a prevPath to prevent errors
          prevPath.set('/main/home')
          switch (data.type) {
            case NotificationType.Daily:
              userSubmission.set(null);
              friendSubmissions.set([]);
              await goto('/main/home');
              break;
            case NotificationType.LateSubmission:
              await goto('/main/home');
              break;
            case NotificationType.Comment:
              const sub = await getSubmission(data.id);
              activeSubmission.set(sub);
              if (sub) await goto('/modal/submission');
              break;
            case NotificationType.FriendRequestCreated:
              await goto('/modal/friends');
              break;
            case NotificationType.FriendRequestAccepted:
              await goto('/modal/friends');
              break;
            default:
              break;
          }
        }
      },
    );
    // remove notification bubble on app launch
    if (Capacitor.getPlatform() !== 'web')
      await FirebaseMessaging.removeAllDeliveredNotifications();
  }
  // device specific layout logic
  const is = await SafeArea.getSafeAreaInsets();
  insets.set(is.insets);
};

const setupQueriesAndDeepLinks = () => {
  // setup for deep links and query parameters
  if (window.location.search)
    initParams.set(new URLSearchParams(window.location.search));
};

const setupSessionsAndAuth = async () => {
  // user auth logic
  session.update((s) => ({ ...s, loaded: false }));
  await FirebaseAuthentication.addListener('authStateChange', async (state) => {
    if (state.user) {
      if (get(session).loggedIn) return;
      await authSession(state.user);
      if (!snapshotsInit) {
        loadingFriendSubmissions.set(true)
        await setupSnapshots().catch(async (e) => {
          if (e.message.includes('Missing or insufficient permissions')) {
            await FirebaseAuthentication.signOut();
            await endSession();
            await goto('/intro/login');
          } else {
            console.log(
              'load (listener): snapshot setup error',
              e,
              get(session),
            );
          }
        });
        loadingFriendSubmissions.set(false);
        snapshotsInit = true;
      }
    } else {
      await goto('/intro/login');
    }
    // check for music platform authentication on web only after authenticating
    await musicPlatformInit()
    appLoaded.set(true);
  });
  // init session
  await loadSession();
  if (get(session).loggedIn) {
    if (!snapshotsInit) {
      // make sure we have a auth session saved
      loadingFriendSubmissions.set(true)
      await setupSnapshots().catch(async (e) => {
        if (e.message.includes('Missing or insufficient permissions') || dev) {
          await FirebaseAuthentication.signOut();
          await endSession();
          await goto('/intro/login');
        } else {
          console.log('load: snapshot setup error', e, get(session));
        }
      });
      loadingFriendSubmissions.set(false);
      snapshotsInit = true;
    }
    // check for music platform authentication on web only after authenticating
    await musicPlatformInit()
    appLoaded.set(true);
  } else {
    await goto('/intro/login');
  }
  // handle app load from background -- reload snapshots
  await App.addListener('appStateChange', async (state) => {
    if (state.isActive)
      // only setup the snapshots if we've already init them
      if (snapshotsInit) {
        await setupSnapshots();
        loadingFriendSubmissions.set(false);
      }
  });
};

const setupNavigationLogic = async () => {
  // handle dynamic pages
  if (get(page).route.id?.includes('modal/profile')) {
    const username = get(page).url.searchParams.get('user') || '';
    if (!username) await goto('/main/home');
    publicProfileUsername.set(username);
  }
  if (get(page).route.id?.includes('modal/submission')) {
    const subId = get(page).url.searchParams.get('id') || '';
    if (!subId) await goto('/main/home');
    const submission = await getSubmission(subId);
    activeSubmission.set(submission);
  }
};

// page load setup
if (browser) {
  setupQueriesAndDeepLinks();
  (async () => {
    await setupDevice();
    await setupSessionsAndAuth();
    await setupNavigationLogic();
    appLoaded.set(true);
  })();
}
