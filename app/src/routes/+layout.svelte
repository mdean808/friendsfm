<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { navigating, page } from '$app/stores';
  import { insets } from '$lib/device';
  import {
    loading,
    toast,
    errorToast,
    appLoaded,
    publicProfileUsername,
  } from '$lib/util';
  import { fade, slide } from 'svelte/transition';
  import Toast from '$components/Toast.svelte';
  import Loading from '$components/Loading.svelte';
  import Icon from '$assets/icon.png';
  import LoadingIndicator from '$components/LoadingIndicator.svelte';

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
  import { SplashScreen } from '@capacitor/splash-screen';
  import { goto } from '$app/navigation';
  import { activeSubmission } from '$lib/submission';

  //export let data: LayoutData;

  $: if ($navigating)
    (() => {
      if ($navigating) {
        console.log(`navigated to: ${$navigating.to?.route.id}`);
        // handle dynamic route updates
        if ($navigating.to?.route.id === '/modal/profile') {
          $page.url.searchParams.set('user', $publicProfileUsername);
          goto(
            `${$navigating.to?.route.id}?${$page.url.searchParams.toString()}`
          );
        }
        if ($navigating.to?.route.id === '/modal/submission') {
          if (!$activeSubmission) return;
          $page.url.searchParams.set('id', $activeSubmission.id);
          goto(
            `${$navigating.to?.route.id}?${$page.url.searchParams.toString()}`
          );
        }
      }
    })();

  onMount(async () => {
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
    await SplashScreen.hide();
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
    {#if !$appLoaded}
      <div transition:fade={{ duration: 100 }}>
        <div class="z-40 fixed top-0 left-0 bg-gray-800 w-full h-full flex">
          <div class="self-center mx-auto items-center justify-center">
            <img
              src={Icon}
              alt="FriendsFM Logo"
              class="mx-auto mt-16 w-56 h-56"
            />
            <LoadingIndicator className="w-16 h-16 mx-auto" />
          </div>
        </div>
      </div>
    {/if}

    {#if $appLoaded}
      {#if $page.route.id?.includes('/main/')}
        <TopNav />
      {/if}
      <slot />
      {#if $page.route.id?.includes('/main/')}
        <BottomNav />
      {/if}
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
