<script lang="ts">
  import { FirebaseMessaging } from '@capacitor-firebase/messaging';
  import { SvelteToast } from '@zerodevx/svelte-toast';
  import { Capacitor } from '@capacitor/core';

  import Home from './pages/home.svelte';
  import NewUser from './pages/new_user.svelte';
  import Songs from './pages/songs.svelte';
  import Audial from './pages/audial.svelte';
  import Username from './pages/username.svelte';
  import MusicProvider from './pages/music_provider.svelte';
  import Settings from './pages/settings.svelte';
  import { onMount } from 'svelte';

  import {
    user,
    currPath,
    bottomInset,
    getStatusBarHeight,
    statusBarHeight,
    getBottomInset,
    loading,
    getNewAuthToken,
    getUserFromPreferences,
    loggedIn,
    notificationAction,
    refreshUser,
    getSubmissionStatus,
    appLoading,
    platform,
  } from './store';
  import { goto } from './lib';
  import Loading from './components/Loading.svelte';
  import Friends from './pages/friends.svelte';
  import { fade, fly } from 'svelte/transition';
  import TopNav from './components/TopNav.svelte';
  import BottomNav from './components/BottomNav.svelte';
  import PasteAudial from './pages/paste_audial.svelte';

  // IONIC SETUP
  import { initialize } from '@ionic/core/components';
  // Add imports for all components used in your application
  // Note: The componets MUST be imported from @ionic/core/components
  import { IonRefresher } from '@ionic/core/components/ion-refresher';
  import { IonRefresherContent } from '@ionic/core/components/ion-refresher-content';
  import { IonSpinner } from '@ionic/core/components/ion-spinner';
  import { IonApp } from '@ionic/core/components/ion-app';
  import { IonContent } from '@ionic/core/components/ion-content';
  import OSLogger from './plugins/OSLogger';
  import { SplashScreen } from '@capacitor/splash-screen';
  import * as Sentry from '@sentry/capacitor';
  import * as SentrySvelte from '@sentry/svelte';
  import { BrowserTracing } from '@sentry/tracing';
  import AnimatedSplashScreen from './components/AnimatedSplashScreen.svelte';

  notificationAction.subscribe(async (notif) => {
    const title = notif.title;
    await getUserFromPreferences();
    if (title.includes('added you as a friend')) {
      await refreshUser();
      goto('/friends');
    } else if (
      title.includes('FriendsFM') ||
      title.includes('late submission')
    ) {
      await getSubmissionStatus();
      goto('/');
    } else if (title.includes('accepted your friend request')) {
      await refreshUser();
      goto('/friends');
    }
    if (Capacitor.isPluginAvailable('OSLogger')) {
      await OSLogger.log({ message: currPath.get() + ' ' + title });
    }
  });

  onMount(async () => {
    platform.set(Capacitor.getPlatform());
    SplashScreen.hide();
    if (Capacitor.isPluginAvailable('OSLogger')) {
      await OSLogger.log({ message: 'starting app' });
    }

    if (Capacitor.isPluginAvailable('FirebaseMessaging')) {
      FirebaseMessaging.addListener(
        'notificationActionPerformed',
        ({ notification }) => {
          notificationAction.set(notification);
        }
      );
    }
    initialize();
    // The rest of the ion-elements can be defined as below
    tryDefine('ion-refresher', IonRefresher);
    tryDefine('ion-refresher-content', IonRefresherContent);
    tryDefine('ion-spinner', IonSpinner);
    tryDefine('ion-app', IonApp);
    tryDefine('ion-content', IonContent);
    // Repeat for all components used in your application

    // Prevents exception when hot reloading.
    function tryDefine(tag: string, impl: any) {
      try {
        customElements.define(tag, impl);
      } catch (error) {}
    }
    // Applies required global styles
    document.documentElement.classList.add('ion-ce');
    loading.set(false);

    await getStatusBarHeight();
    await getBottomInset();
    // request permissions
    FirebaseMessaging.requestPermissions();
    // load user
    await getNewAuthToken();
    await getUserFromPreferences();
    const u = user.get();
    if (!loggedIn.get() || !u || Object.keys(u).length === 0)
      return goto('/new_user');
    if (u.username && u.username !== u.id && u.musicPlatform) {
      goto('/');
    } else if (!u.username || u.username === u.id) {
      goto('/username');
    } else if (!u.musicPlatform) {
      goto('/music_provider');
    } else {
      goto('/new_user');
    }
    // if (import.meta.env.PROD) {
    //   Sentry.init(
    //     {
    //       dsn: 'https://6b81e7dbc9474aa9bb64e2b24652684d@o4504839408844801.ingest.sentry.io/4504839411400704',
    //       // Set your release version, such as 'getsentry@1.0.0'
    //       release: `friendsfm@0.0.4`,
    //       integrations: [new BrowserTracing()] as any[],
    //       // Set your dist version, such as "1"
    //       dist: '1',
    //       tracesSampleRate: 0.25,
    //     },
    //     SentrySvelte.init
    //   );
    // }
  });
</script>

<!-- Navigation -->
<svelte:head>
  <title>{$currPath?.split('/')[1] || 'home'}</title>
</svelte:head>
{#if $appLoading}
  <div transition:fade={{ duration: 100 }}>
    <AnimatedSplashScreen />
  </div>
{/if}
<ion-app>
  <div class="overflow-y-hidden">
    <div class="absolute" style={`bottom: calc(110px + ${$bottomInset}px); `}>
      <SvelteToast
        options={{
          reversed: true,
        }}
      />
    </div>
    {#if $loading}
      <div transition:fade={{ duration: 100 }}>
        <Loading />
      </div>
    {/if}

    <div>
      {#if $loggedIn && $user.username && $user.musicPlatform}
        <TopNav />
      {/if}
      <main
        style={`height: calc(100vh - ${
          110 + $bottomInset + $statusBarHeight
        }px)`}
      >
        {#if $currPath === '/'}
          <div
            style="height: inherit;"
            class="overflow-y-scroll"
            in:fly={{ y: document.body.clientHeight }}
          >
            <Home />
          </div>
        {:else if $currPath === '/songs'}
          <div
            style="height: inherit;"
            class="overflow-y-scroll"
            in:fly={{ x: -document.body.clientWidth }}
          >
            <Songs />
          </div>
        {:else if $currPath === '/audial'}
          <div
            style="height: inherit;"
            in:fly={{ x: document.body.clientWidth }}
          >
            <Audial />
          </div>
        {:else if $currPath === '/new_user'}
          <div style={`margin-top: 55px`} in:fade={{ duration: 300 }}>
            <NewUser />
          </div>
        {:else if $currPath === '/username'}
          <div style={`margin-top: 55px`} in:fade={{ duration: 300 }}>
            <Username />
          </div>
        {:else if $currPath === '/music_provider'}
          <div style={`margin-top: 55px`} in:fade={{ duration: 300 }}>
            <MusicProvider />
          </div>
        {:else if $currPath === '/settings'}
          <div
            style={`padding-top: ${0 + $statusBarHeight}px`}
            class="z-40 bg-gray-900 absolute left-0 top-0 w-full h-[100vh]"
            transition:fly={{ x: document.body.clientWidth }}
          >
            <Settings />
          </div>
        {:else if $currPath === '/friends'}
          <div
            style={`padding-top: ${0 + $statusBarHeight}px`}
            class="z-40 bg-gray-900 w-full absolute top-0 left-0 h-[100vh]"
            transition:fly={{ x: -document.body.clientWidth }}
          >
            <Friends />
          </div>
        {:else if $currPath === '/paste_audial'}
          <div
            style={`padding-top: ${0 + $statusBarHeight}px`}
            class="z-40 bg-gray-900 w-full absolute top-0 left-0 h-[100vh]"
            transition:fly={{ y: -document.body.clientWidth }}
          >
            <PasteAudial />
          </div>
        {/if}
      </main>
      {#if $loggedIn && $user.username && $user.musicPlatform}
        <BottomNav />
      {/if}
    </div>

    <div class="hidden">
      Hidden div for Tailwind JIT
      <span class="text-spotify" />
      <span class="text-apple-music" />
    </div>
  </div>
</ion-app>
