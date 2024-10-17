<script lang="ts">
  import { Preferences } from '@capacitor/preferences';
  import Button from './Button.svelte';
  import { loading } from '$lib/util';
  import { generateSubmission, userSubmission } from '$lib/submission';
  import { getFriendSubmissions } from '$lib/preferences';
  import { insets, updateCurrentLocation } from '$lib/device';
  import { getNearbySubmissions } from '$lib/nearby';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { session } from '$lib/session';

  let elem: HTMLDivElement;

  const createSubmission = async () => {
    loading.set(true);
    await generateSubmission();
    getFriendSubmissions();
    (async () => {
      await updateCurrentLocation();
      // grab all submissions for the world if we don't have location permissions
      if (
        (await Preferences.get({ key: 'location-permissions' })).value === '0'
      )
        getNearbySubmissions(undefined, {
          southWest: {
            latitude: 80,
            longitude: 180,
          },
          northEast: {
            latitude: -80,
            longitude: -180,
          },
        });
      else getNearbySubmissions(20);
    })();
    loading.set(false);
  };
</script>

<div class={`w-full absolute left-0 bottom-0`} bind:this={elem}>
  {#if !$userSubmission?.song && !$page.route.id?.includes('/main/audial')}
    <div class="px-4 w-full mb-2">
      <div
        class="border-white rounded-lg bg-gray-800 bg-opacity-70 backdrop-blur-md py-3 px-3 border-2"
      >
        <p class="text-center">see what your friends are listening to...</p>
        <Button
          type="primary"
          className="my-2 bg-blue-500"
          title="Share current song."
          on:click={createSubmission}
          >share now!
        </Button>
      </div>
    </div>
  {/if}
  <div
    class="flex backdrop-blur-xl h-full rounded-t-lg"
    style={`padding-bottom: ${$insets?.bottom}px`}
  >
    <!--        <button-->
    <!--          on:click={() => goto('/main/songs')}-->
    <!--          class="w-1/3 flex justify-center py-2"-->
    <!--        >-->
    <!--          <span-->
    <!--            class={`mx-auto rounded-full border bg-gray-900 px-6 pt-1 ${-->
    <!--              $page.route.id === '/main/songs'-->
    <!--                ? `border-${$session.user?.public?.musicPlatform} `-->
    <!--                : 'currentColor border-transparent'-->
    <!--            }`}-->
    <!--          >-->
    <!--            <svg-->
    <!--              class={`w-6 h-6 mx-auto ${-->
    <!--                $page.route.id === '/main/songs'-->
    <!--                  ? `text-${$session.user?.public?.musicPlatform}`-->
    <!--                  : 'currentColor'-->
    <!--              }`}-->
    <!--              fill={'currentColor'}-->
    <!--              viewBox="0 0 20 20"-->
    <!--              xmlns="http://www.w3.org/2000/svg"-->
    <!--              ><path-->
    <!--                d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"-->
    <!--              /></svg-->
    <!--            >-->
    <!--            <span class="text-white">songs</span>-->
    <!--          </span>-->
    <!--        </button>-->

    <button
      on:click={() => goto('/main/audial')}
      class="w-1/3 flex justify-center py-2"
    >
      <span
        class={`mx-auto rounded-full border bg-gray-900 px-6 pt-1 ${
          $page.route.id === '/main/audial'
            ? `border-${$session.user?.public?.musicPlatform} `
            : 'currentColor border-transparent'
        }`}
      >
        <svg
          class={`w-6 h-6 mx-auto ${
            $page.route.id === '/main/audial'
              ? `text-${$session.user?.public?.musicPlatform}`
              : 'currentColor'
          }`}
          data-slot="icon"
          fill="none"
          stroke-width="1.5"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
          ></path>
        </svg>
        <span class="text-white">audial</span>
      </span>
    </button>
    <button
      on:click={() => goto('/main/home')}
      class="w-1/3 flex justify-center py-2"
    >
      <div
        class={`mx-auto rounded-full border bg-gray-900 px-6 pt-1 ${
          $page.route.id === '/main/home'
            ? `border-${$session.user?.public?.musicPlatform} `
            : 'currentColor border-transparent'
        }`}
      >
        <svg
          class={`w-6 h-6 mx-auto ${
            $page.route.id === '/main/home'
              ? `text-${$session.user?.public?.musicPlatform}`
              : 'currentColor'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
          />
        </svg>
        <span class="text-white">home</span>
      </div>
    </button>
    <button
      on:click={() => goto('/main/profile')}
      class="w-1/3 flex justify-center py-2"
    >
      <div
        class={`mx-auto rounded-full border bg-gray-900 px-6 pt-1 ${
          $page.route.id === '/main/profile'
            ? `border-${$session.user?.public?.musicPlatform}`
            : 'currentColor border-transparent'
        }`}
      >
        <svg
          class={`w-6 h-6 mx-auto ${
            $page.route.id === '/main/profile'
              ? `text-${$session.user?.public?.musicPlatform}`
              : 'currentColor'
          }`}
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
        <span class="text-white">profile</span>
      </div>
    </button>
  </div>
</div>
