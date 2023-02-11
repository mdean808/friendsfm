<script lang="ts">
  import { Route } from "tinro";

  import { FirebaseMessaging } from "@capacitor-firebase/messaging";
  import { SvelteToast } from '@zerodevx/svelte-toast'

  import Home from "./pages/home.svelte";
  import NewUser from "./pages/new_user.svelte";
  import Songs from "./pages/songs.svelte";
  import Audial from "./pages/audial.svelte";
  import Username from "./pages/username.svelte";
  import EmailLogin from "./pages/email_login.svelte";
  import MusicProvider from "./pages/music_provider.svelte";
  import { onMount } from "svelte";

  import {
    user,
    currPath,
    bottomInset,
    getStatusBarHeight,
    getBottomInset,
  } from "./store";
  import { getPlatformColor, goto, getUserFromPreferences } from "./lib";

  onMount(async () => {
    await FirebaseMessaging.requestPermissions();
    const tokenRes = await FirebaseMessaging.getToken();
    console.log('MessagingPermissions:', tokenRes.token);

    user.set(await getUserFromPreferences());
    await getStatusBarHeight();
    await getBottomInset();
    const u = user.get();

    if (u && u.registered) {
      goto("/");
    } else if (u && !u.username) {
      goto("/username");
    } else if (u && !u.musicPlatform) {
      goto("/music_provider");
    } else {
      goto("/new_user");
    }
  });
</script>

<!-- Navigation -->
{#if $user?.registered}
  <nav
    style={`height: ${70 + $bottomInset + (bottomInset ? -15 : 0)}px`}
    class={`bottom-0 fixed bg-gray-900 flex w-full`}
  >
    <button
      on:click={() => goto("/songs")}
      class="w-1/3 flex justify-center py-2"
    >
      <div class="mx-auto">
        <svg
          class={`w-6 h-6 mx-auto ${
            $currPath === "/songs"
              ? `text-${getPlatformColor($user.musicPlatform)}`
              : "currentColor"
          }`}
          fill={"currentColor"}
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
          /></svg
        >
        <span class="text-white">songs</span>
      </div>
    </button>
    <button on:click={() => goto("/")} class="w-1/3 flex justify-center py-2">
      <div class="mx-auto">
        <svg
          class={`w-6 h-6 mx-auto ${
            $currPath === "/"
              ? `text-${getPlatformColor($user.musicPlatform)}`
              : "currentColor"
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
      on:click={() => goto("/audial")}
      class="w-1/3 flex justify-center py-2"
    >
      <div class="mx-auto">
        <svg
          class={`w-6 h-6 mx-auto ${
            $currPath === "/audial"
              ? `text-${getPlatformColor($user.musicPlatform)}`
              : "currentColor"
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
  </nav>
{/if}

<!-- Routing -->
<main>
  <SvelteToast options={{theme: {
    '--toastContainerTop': 'auto',
    '--toastContainerRight': 'auto',
    '--toastContainerBottom': '8rem',
    '--toastContainerLeft': 'calc(50vw - 8rem);'
  }}}/>
  <Route path="/new_user"><NewUser /></Route>
  <Route path="/email_login"><EmailLogin /></Route>
  <Route path="/username"><Username /></Route>
  <Route path="/music_provider"><MusicProvider /></Route>
  <Route path="/songs"><Songs /></Route>
  <Route path="/">
    <Home />
  </Route>
  <Route path="/audial"><Audial /></Route>
</main>

<div class="hidden">
  Hidden div for Tailwind JIT
  <span class="text-spotify" />
  <span class="text-apple-music" />
</div>
