<script lang="ts">
  import { FirebaseMessaging } from '@capacitor-firebase/messaging';
  import {
    SvelteToast,
    toast,
    type SvelteToastOptions,
  } from '@zerodevx/svelte-toast';
  import { Capacitor } from '@capacitor/core';

  import Home from './pages/home.svelte';
  import NewUser from './pages/new_user.svelte';
  import Songs from './pages/songs.svelte';
  // import Audial from './pages/audial.svelte';
  import PrivateProfile from './pages/private_profile.svelte';
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
    friendSubmissions,
    userSubmission,
    activeSubmission,
    deepLink,
    loginState,
  } from './store';
  import { goto } from './lib';
  import Loading from './components/Loading.svelte';
  import Friends from './pages/friends.svelte';
  import { fade, fly } from 'svelte/transition';
  import TopNav from './components/TopNav.svelte';
  import BottomNav from './components/BottomNav.svelte';
  import PasteAudial from './pages/paste_audial.svelte';
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
  import SearchMusicPlatform from './pages/search_music_platform.svelte';
  import PublicProfile from './pages/public_profile.svelte';
  import ModalPageWrapper from './components/ModalPageWrapper.svelte';
  import { UserState } from './types';
  import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

  notificationAction.subscribe(async (notif) => {
    if (!notif || !notif.data) return;
    await getUserFromPreferences();
    // handle routing for new notifications
    const data = notif.data as { [key: string]: any };
    await FirebaseAnalytics.logEvent({
      name: 'notification_open',
      params: {
        title: notif.title,
        body: notif.body,
        subtitle: notif.subtitle,
        id: data.id,
        type: data.type,
      },
    });
    if (data.type === 'request-create') {
      await refreshUser();
      goto('/friends');
    } else if (data.type === 'daily' || data.type === 'late-submission') {
      goto('/');
    } else if (data.type === 'request-accept') {
      await refreshUser();
      goto('/friends');
    } else if (data.type === 'comment') {
      const subId = data.id;
      const sub =
        $friendSubmissions.find((s) => s.id === subId) ||
        ($userSubmission.id === subId ? $userSubmission : null);
      if (sub) {
        activeSubmission.set(sub);
        goto('/&submission');
      } else {
        const toastError: SvelteToastOptions = {
          theme: {
            '--toastColor': 'white',
            '--toastBackground': '#ad2626',
            '--toastBarBackground': 'white',
          },
        };
        toast.push('Error: Comment not found.', toastError);
      }
    }
  });

  onMount(async () => {
    // await initAppCheck();
    platform.set(Capacitor.getPlatform());
    SplashScreen.hide();

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
    await getUserFromPreferences();
    await getNewAuthToken();
    if (!$loggedIn || !$user || Object.keys($user).length === 0) {
      loggedIn.set(false);
      loginState.set(UserState.unregistered);
      return goto('/new_user');
    }

    if ($loginState === UserState.registered) {
      // don't goto home if we have a deeplink
      if (!$deepLink) goto('/');
    } else if ($loginState === UserState.registeringUsername) {
      goto('/username');
    } else if ($loginState === UserState.registeringMusicPlatform) {
      goto('/music_provider');
    } else {
      goto('/new_user');
    }
    appLoading.set(false);
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
      <ModalPageWrapper flySettings={{ x: document.body.clientWidth }}>
        <Settings />
      </ModalPageWrapper>
    {:else if $currPath === '/genre'}
      <ModalPageWrapper flySettings={{ y: document.body.clientHeight }}>
        <Genre />
      </ModalPageWrapper>
    {:else if $currPath === '/friends'}
      <ModalPageWrapper flySettings={{ x: -document.body.clientWidth }}>
        <Friends />
      </ModalPageWrapper>
    {:else if $currPath === '/paste_audial'}
      <ModalPageWrapper flySettings={{ y: -document.body.clientHeight }}>
        <PasteAudial />
      </ModalPageWrapper>
    {:else if $currPath === '/search_music_platform'}
      <ModalPageWrapper flySettings={{ y: document.body.clientHeight }}>
        <SearchMusicPlatform />
      </ModalPageWrapper>
    {:else if $currPath === '/public_profile'}
      <ModalPageWrapper flySettings={{ y: document.body.clientHeight }}>
        <PublicProfile />
      </ModalPageWrapper>
    {/if}
    <!-- END absolute positioning -->
    {#if $loggedIn && $user?.username && $user?.musicPlatform && $currPath !== '/audial'}
      <TopNav />
    {/if}
    <!-- APP BODY -->
    <main style={`height: calc(100% - 65px);`}>
      {#if $currPath === '/' || ($currPath.includes('/&') && $currPath === '/')}
        <div
          class="h-full"
          in:fly={{
            x:
              document.body.clientWidth *
              ($prevPath === '/songs' || $prevPath === '/friends' ? 1 : -1) *
              ($prevPath.includes('&submission') ||
              $prevPath === '/public_profile'
                ? 0
                : 1),
            y:
              ($prevPath.includes('&submission') ||
                $prevPath === '/public_profile') &&
              document.body.clientHeight,
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
      {:else if $currPath === '/private_profile'}
        <div
          class="h-full"
          in:fly={{
            x:
              $prevPath === '/search_music_platform'
                ? 0
                : document.body.clientWidth,
            y:
              $prevPath === '/search_music_platform'
                ? document.body.clientHeight
                : 0,
          }}
        >
          <PrivateProfile />
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
  <span class="bg-spotify" />
  <span class="border-spotify" />
  <span class="text-apple-music" />
  <span class="bg-apple-music" />
  <span class="border-apple-music" />
</div>
