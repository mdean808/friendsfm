<script lang="ts">
  import { FirebaseMessaging } from '@capacitor-firebase/messaging';
  import { SvelteToast } from '@zerodevx/svelte-toast';

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
  } from './store';
  import { getPlatformColor, goto } from './lib';
  import Loading from './components/Loading.svelte';
  import Friends from './pages/friends.svelte';
  import { fade, fly, slide } from 'svelte/transition';

  onMount(async () => {
    loading.set(false);

    await getStatusBarHeight();
    await getBottomInset();
    // request permissions
    FirebaseMessaging.requestPermissions();
    // load user
    if (!(await getNewAuthToken())) {
      goto('/new_user');
    } else {
      await getUserFromPreferences();
      const u = user.get();
      if (!u || Object.keys(u).length === 0) return goto('/new_user');
      if (u.username && u.musicPlatform) {
        goto('/');
      } else if (!u.username || u.username === u.id) {
        goto('/username');
      } else if (!u.musicPlatform) {
        goto('/music_provider');
      } else {
        goto('/new_user');
      }
    }
  });
</script>

<!-- Navigation -->
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
{#if $currPath === '/friends'}
  <div transition:fly={{ x: -document.body.clientWidth }}>
    <Friends />
  </div>
{:else if $currPath === '/settings'}
  <div transition:fly={{ x: document.body.clientWidth }}>
    <Settings />
  </div>
{:else if $user?.username && $user.musicPlatform}
  <div
    transition:slide
    style={`height: ${70 + $bottomInset + (bottomInset ? -15 : 0)}px`}
    class={`bottom-0 fixed bg-gray-900 flex w-full`}
  >
    <button
      on:click={() => goto('/songs')}
      class="w-1/3 flex justify-center py-2"
    >
      <div class="mx-auto">
        <svg
          class={`w-6 h-6 mx-auto ${
            $currPath === '/songs'
              ? `text-${getPlatformColor($user.musicPlatform)}`
              : 'currentColor'
          }`}
          fill={'currentColor'}
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
          /></svg
        >
        <span class="text-white">songs</span>
      </div>
    </button>
    <button on:click={() => goto('/')} class="w-1/3 flex justify-center py-2">
      <div class="mx-auto">
        <svg
          class={`w-6 h-6 mx-auto ${
            $currPath === '/'
              ? `text-${getPlatformColor($user.musicPlatform)}`
              : 'currentColor'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
          /></svg
        >
        <span class="text-white">home</span>
      </div>
    </button>
    <button
      on:click={() => goto('/audial')}
      class="w-1/3 flex justify-center py-2"
    >
      <div class="mx-auto">
        <svg
          class={`w-6 h-6 mx-auto ${
            $currPath === '/audial'
              ? `text-${getPlatformColor($user.musicPlatform)}`
              : 'currentColor'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clip-rule="evenodd"
          /></svg
        >
        <span class="text-white">audial</span>
      </div>
    </button>
  </div>
  <div
    transition:slide
    style={`height: ${55 + $statusBarHeight}px`}
    class={`top-0 bg-gray-900 left-0 fixed w-full `}
  >
    <div
      style={`margin-top: ${$statusBarHeight}px`}
      class={`w-full flex p-3  flex-row justify-between items-center text-${getPlatformColor(
        $user?.musicPlatform
      )}`}
    >
      <button class="flex-grow-0" on:click={() => goto('/friends')}>
        <svg
          class="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
          /></svg
        >
      </button>
      <h1
        class="text-center mx-auto text-2xl text-white truncate flex-grow px-4"
      >
        {$user.username}
      </h1>
      <button class="flex-grow-0" on:click={() => goto('/settings')}>
        <svg
          class="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
            clip-rule="evenodd"
          /></svg
        >
      </button>
    </div>
  </div>
{/if}
<!-- Routing -->
<main
  style={`margin-top: calc(55px + ${$statusBarHeight}px); 
          height: calc(100vh - ${110 + $bottomInset + $statusBarHeight}px)`}
>
  {#if $currPath === '/'}
    <div in:fly={{ y: document.body.clientHeight, duration: 400 }}>
      <Home />
    </div>
  {:else if $currPath === '/songs'}
    <div transition:fly={{ x: -document.body.clientWidth, duration: 250 }}>
      <Songs />
    </div>
  {:else if $currPath === '/audial'}
    <div transition:fly={{ x: document.body.clientWidth, duration: 250 }}>
      <Audial />
    </div>
  {:else if $currPath === '/new_user'}
    <div in:fade={{ duration: 300 }}>
      <NewUser />
    </div>
  {:else if $currPath === '/username'}
    <div in:fade={{ duration: 300 }}>
      <Username />
    </div>
  {:else if $currPath === '/music_provider'}
    <div in:fade={{ duration: 300 }}>
      <MusicProvider />
    </div>
  {/if}
</main>

<div class="hidden">
  Hidden div for Tailwind JIT
  <span class="text-spotify" />
  <span class="text-apple-music" />
</div>
