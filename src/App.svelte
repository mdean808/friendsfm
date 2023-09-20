<script lang="ts">
  import { FirebaseMessaging } from '@capacitor-firebase/messaging';
  import { SvelteToast } from '@zerodevx/svelte-toast';
  import { Capacitor } from '@capacitor/core';

  import Home from './pages/home.svelte';
  import NewUser from './pages/new_user.svelte';
  import Songs from './pages/songs.svelte';
  // import Audial from './pages/audial.svelte';
  import Stats from './pages/stats.svelte';
  import Username from './pages/username.svelte';
  import MusicProvider from './pages/music_provider.svelte';
  import Settings from './pages/settings.svelte';
  import { onMount } from 'svelte';

  import {
    user,
    currPath,
    insets,
    getStatusBarHeight,
    getInsets,
    loading,
    getNewAuthToken,
    getUserFromPreferences,
    loggedIn,
    prevPath,
    notificationAction,
    refreshUser,
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
  import OSLogger from './plugins/OSLogger';
  import { SplashScreen } from '@capacitor/splash-screen';
  import AnimatedSplashScreen from './components/AnimatedSplashScreen.svelte';

  // IONIC SETUP
  import { initialize } from '@ionic/core/components';
  // Add imports for all components used in your application
  // Note: The componets MUST be imported from @ionic/core/components
  import { IonRefresher } from '@ionic/core/components/ion-refresher';
  import { IonRefresherContent } from '@ionic/core/components/ion-refresher-content';
  import { IonSpinner } from '@ionic/core/components/ion-spinner';
  import { IonApp } from '@ionic/core/components/ion-app';
  import { IonContent } from '@ionic/core/components/ion-content';
  import Genre from './pages/genre.svelte';
  import Submission from './pages/submission.svelte';

  notificationAction.subscribe(async (notif) => {
    if (!notif || !notif.title) return;
    const title = notif.title;
    await getUserFromPreferences();
    if (title.includes('added you as a friend')) {
      await refreshUser();
      goto('/friends');
    } else if (
      title.includes('FriendsFM') ||
      title.includes('late submission')
    ) {
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
    // await initAppCheck();
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
    loading.set(false);

    await getStatusBarHeight();
    await getInsets();
    // request permissions
    FirebaseMessaging.requestPermissions();
    try {
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
    } catch (e) {
      console.log('ionic error:', e);
    }
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
  });
</script>

<!-- Navigation -->
<svelte:head>
  <title>{$currPath?.split('/')[1] || 'home'}</title>
  <script
    defer
    async
    src={'https://maps.googleapis.com/maps/api/js?key=' +
      import.meta.env.VITE_GOOGLE_MAPS_KEY +
      '&callback=mapready'}
  >
  </script>
</svelte:head>

<ion-app>
  <!-- FULL APP WRAPPER -->
  <!-- padding handles device-specific insets -->
  <div
    style={`padding-top: ${$insets.top}px; padding-bottom: ${
      $insets.bottom / 2
    }px`}
    class="relative h-screen max-h-screen"
  >
    <!-- START absolute positioning -->

    <!-- put the toast double the height of the bottom nav -->
    <div class="absolute" style={`bottom: ${55 + $insets.bottom}px; `}>
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

    {#if $currPath.includes('&submission')}
      <Submission />
    {/if}

    {#if $appLoading}
      <div transition:fade={{ duration: 100 }}>
        <AnimatedSplashScreen />
      </div>
    {/if}

    {#if $currPath === '/settings'}
      <div
        style={`padding-top: ${0 + $insets.top}px`}
        class="z-40 bg-gray-900 absolute left-0 top-0 w-full h-full"
        transition:fly={{ x: document.body.clientWidth }}
      >
        <Settings />
      </div>
    {:else if $currPath === '/genre'}
      <div
        style={`padding-top: ${0 + $insets.top}px`}
        class="z-40 bg-gray-900 absolute left-0 top-0 w-full h-full"
        transition:fly={{ y: document.body.clientHeight }}
      >
        <Genre />
      </div>
    {:else if $currPath === '/friends'}
      <div
        style={`padding-top: ${0 + $insets.top}px`}
        class="z-40 bg-gray-900 w-full absolute top-0 left-0 h-full"
        transition:fly={{ x: -document.body.clientWidth }}
      >
        <Friends />
      </div>
    {:else if $currPath === '/paste_audial'}
      <div
        style={`padding-top: ${0 + $insets.top}px`}
        class="z-40 bg-gray-900 w-full absolute top-0 left-0 h-full"
        transition:fly={{ y: -document.body.clientWidth }}
      >
        <PasteAudial />
      </div>
    {/if}
    <!-- END absolute positioning -->
    {#if $loggedIn && $user?.username && $user?.musicPlatform && $currPath !== '/audial'}
      <TopNav />
    {/if}
    <!-- APP BODY -->
    <main style={`height: calc(100% - 70px - 65px);`}>
      {#if $currPath === '/' || ($currPath.includes('/&') && $currPath === '/')}
        <div
          class="h-full"
          in:fly={{
            x:
              document.body.clientWidth *
              ($prevPath === '/songs' || $prevPath === '/friends' ? 1 : -1) *
              ($prevPath.includes('&submission') ? 0 : 1),
            y: $prevPath.includes('&submission') && document.body.clientHeight,
          }}
        >
          <Home />
        </div>
      {:else if $currPath === '/songs'}
        <div class="h-full" in:fly={{ x: -document.body.clientWidth }}>
          <Songs />
        </div>
        <!--{:else if $currPath === '/audial'}
        <!--<div in:fly={{ x: document.body.clientWidth }}>
        <!--  <Audial />
        <!-- </div>
        -->
      {:else if $currPath === '/stats'}
        <div class="h-full" in:fly={{ x: document.body.clientWidth }}>
          <Stats />
        </div>
      {:else if $currPath === '/new_user'}
        <div class="h-full" in:fade={{ duration: 300 }}>
          <NewUser />
        </div>
      {:else if $currPath === '/username'}
        <div class="h-full" in:fade={{ duration: 300 }}>
          <Username />
        </div>
      {:else if $currPath === '/music_provider'}
        <div class="h-full" in:fade={{ duration: 300 }}>
          <MusicProvider />
        </div>
      {/if}
      <!-- NAVS FIXED -->
    </main>
    {#if $loggedIn && $user?.username && $user?.musicPlatform}
      <BottomNav />
    {/if}
  </div>
</ion-app>

<div class="hidden">
  Hidden div for Tailwind JIT
  <span class="text-spotify" />
  <span class="text-apple-music" />
  <span class="border-spotify" />
</div>
