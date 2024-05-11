<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
  import { loadSession, authSession, session } from '$lib/session';
  import { page } from '$app/stores';
  import { insets } from '$lib/device';
  import { loading, toast, errorToast } from '$lib/util';
  import { fade, slide } from 'svelte/transition';
  import { setupSnapshots } from '$lib/firebase';
  import Toast from '$components/Toast.svelte';
  import Loading from '$components/Loading.svelte';

  // IONIC SETUP
  import { initialize } from '@ionic/core/components';
  // Add imports for all components used in your application
  // Note: The components MUST be imported from @ionic/core/components
  import { IonRefresher } from '@ionic/core/components/ion-refresher';
  import { IonRefresherContent } from '@ionic/core/components/ion-refresher-content';
  import { IonSpinner } from '@ionic/core/components/ion-spinner';
  import { IonApp } from '@ionic/core/components/ion-app';
  import { IonContent } from '@ionic/core/components/ion-content';
  import TopNav from '$components/TopNav.svelte';
  import BottomNav from '$components/BottomNav.svelte';

  let snapshotsInit = false;

  onMount(async () => {
    snapshotsInit = false;
    // init session
    await loadSession();
    if ($session.loggedIn) {
      if (!snapshotsInit) {
        setupSnapshots();
        snapshotsInit = true;
      }
      await goto('/main/home');
    } else {
      await goto('/intro/login');
    }
    // handle login state change
    FirebaseAuthentication.addListener('authStateChange', async (state) => {
      if (state.user) {
        if ($session.loggedIn) return;
        await authSession(state.user);
        if (!snapshotsInit) {
          setupSnapshots();
          snapshotsInit = true;
        }
        await goto(`/main/home`);
      } else {
        await goto('/intro/login');
      }
    });
    // ionic init
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
      errorToast({ content: e as string });
    }
  });
</script>

<svelte:head>
  <title>
    friendsfm | {$page.url.pathname.split('/').pop() || 'home'}
  </title>
  <script
    defer
    async
    src={'https://maps.googleapis.com/maps/api/js?key=' +
      'AIzaSyDtWFyFjHTjbziUvD2Plob40KLYW7XyHa8' +
      '&callback=mapready&loading=async'}
  ></script>
</svelte:head>

<ion-app class="no-scroll">
  <!-- FULL APP WRAPPER -->
  <!-- padding handles device-specific insets -->
  <div
    style={`padding-top: ${$insets?.top}px; padding-bottom: ${
      $insets?.bottom / 2
    }px`}
    class="relative h-screen max-h-screen"
  >
    <!-- START absolute positioning -->

    <!-- put the toast double the height of the bottom nav -->
    {#if $toast?.visible}
      <div
        transition:slide
        class="absolute z-50 w-full"
        style={`bottom: ${75 + $insets?.bottom + ($toast?.offset || 0)}px; `}
      >
        <Toast />
      </div>
    {/if}

    {#if $loading}
      <div transition:fade={{ duration: 100 }}>
        <Loading />
      </div>
    {/if}

    {#if $page.route.id?.includes('/main/')}
      <TopNav />
    {/if}
    <slot />
    {#if $page.route.id?.includes('/main/')}
      <BottomNav />
    {/if}
  </div>
</ion-app>

<div class="hidden">
  Hidden div for Tailwind JIT
  <span class="text-spotify" />
  <span class="to-spotify" />
  <span class="from-spotify" />
  <span class="bg-spotify" />
  <span class="border-spotify" />
  <span class="text-apple-music" />
  <span class="bg-apple-music" />
  <span class="border-apple-music" />
  <span class="to-apple-music" />
  <span class="from-apple-music" />
</div>
