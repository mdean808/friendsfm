import { browser, dev } from '$app/environment';
import { goto } from '$app/navigation';
import { insets } from '$lib/device';
import { setupSnapshots } from '$lib/firebase';
import { authSession, endSession, loadSession, session } from '$lib/session';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';
import { appLoaded, initParams, publicProfileUsername } from '$lib/util';
import { page } from '$app/stores';
import { activeSubmission, getSubmission } from '$lib/submission';
import { Dialog } from '@capacitor/dialog';
import { Capacitor } from '@capacitor/core';
import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { spotifyAuthCode, updateMusicPlatform } from '$lib/user';
import { MusicPlatform } from '$lib/types';

export const ssr = false;
export const prerender = true;

export const load: LayoutLoad = ({ url }) => {
  return {
    url: url.pathname,
  };
};

// page load setup
if (browser) {
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
  (async () => {
    if (Capacitor.getPlatform() === 'ios')
      await Dialog.alert({ message: 'message' });
    // device specific layout logic
    const is = await SafeArea.getSafeAreaInsets();
    insets.set(is.insets);
    // user auth logic
    let snapshotsInit = false;
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
      appLoaded.set(true);
      const platform = get(initParams)?.get('auth');
      // handle spotify
      if (platform === MusicPlatform.spotify) {
        if (
          await updateMusicPlatform(
            MusicPlatform.spotify,
            get(initParams).get('code') || ''
          )
        )
          goto('/main/home');
      }
    });
    // init session
    await loadSession();
    if (get(session).loggedIn) {
      if (!snapshotsInit) {
        // make sure we have a auth session saved
        await setupSnapshots().catch(async (e) => {
          if (
            e.message.includes('Missing or insufficient permissions') ||
            dev
          ) {
            await FirebaseAuthentication.signOut();
            await endSession();
            goto('/intro/login');
          } else {
            console.log('load: snapshot setup error', e, get(session));
          }
        });
        snapshotsInit = true;
      }
    } else {
      goto('/intro/login');
    }
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
  })();
}
