<script lang="ts">
  import Button from '$components/Button.svelte';
  import MusicPlatformIcon from '$components/icons/MusicPlatformIcon.svelte';
  import { MusicPlatform } from '$lib/types';
  import { endSession } from '$lib/session';
  import { goto } from '$app/navigation';
  import { Capacitor } from '@capacitor/core';
  import { loading } from '$lib/util';
  import { updateMusicPlatform } from '$lib/user';
  import AppleMusic, {
    AppleMusicPermissionsResults,
  } from '$plugins/AppleMusic';
  import { authSpotify } from '$lib/spotify';

  let platform: MusicPlatform;

  const setProvider = async () => {
    if (!platform) return;
    if (
      platform === MusicPlatform.appleMusic &&
      Capacitor.getPlatform() !== 'ios'
    )
      return;
    loading.set(true);
    if (platform == MusicPlatform.spotify) {
      authSpotify(platform);
    } else if (platform === MusicPlatform.appleMusic) {
      // return toast.push('Apple Music support in development!');
      switch ((await AppleMusic.checkPermissions()).receive) {
        case AppleMusicPermissionsResults.granted:
          console.log('Apple Music Permissions granted.');
          if (await updateMusicPlatform(platform)) goto('/main/home');
          break;
        case AppleMusicPermissionsResults.prompt: {
          console.log('Apple Music Permissions not granted');
          const res = await AppleMusic.requestPermissions();
          if (res.receive === AppleMusicPermissionsResults.granted) {
            if (await updateMusicPlatform(platform)) goto('/main/home');
          } else console.log('Apple Music Permissions denied AGAIN');
          break;
        }
        case AppleMusicPermissionsResults.denied: {
          console.log('Permissions denied');
          const res = await AppleMusic.requestPermissions();
          if (res.receive === AppleMusicPermissionsResults.granted) {
            if (await updateMusicPlatform(platform)) goto('/main/home');
          } else console.log('Apple Music Permissions denied AGAIN');
          break;
        }
        default: {
          const res = await AppleMusic.requestPermissions();
          if (res.receive === AppleMusicPermissionsResults.granted) {
            if (await updateMusicPlatform(platform)) goto('/main/home');
          } else console.log('Apple Music Permissions denied AGAIN');
          break;
        }
      }
      loading.set(false);
    }
  };
</script>

<main class="text-center mx-auto w-full">
  <div class="mx-auto py-6 px-4 w-full">
    <h1 class="text-4xl">Select a Platform</h1>
    <p class="text-lg text-gray-400">
      choose the service you use to listen to music.
    </p>
    <div class="w-full mt-8">
      <div class="grid grid-cols-2 space-x-2 rounded-xl bg-gray-900 p-2">
        <div>
          <input
            type="radio"
            name="provider"
            id={MusicPlatform.spotify}
            value={MusicPlatform.spotify}
            bind:group={platform}
            class="peer hidden"
            checked
          />
          <label
            for="spotify"
            class="ck flex cursor-pointer select-none rounded-xl p-2 text-center outline:none peer-checked:bg-spotify peer-checked:font-bold peer-checked:text-white"
            ><div class="mx-auto">
              <MusicPlatformIcon
                className={'w-4 inline mr-2 mb-0.5 h-4'}
                id={'spotify'}
              />Spotify®
            </div></label
          >
        </div>

        <div>
          <input
            type="radio"
            name="provider"
            id={MusicPlatform.appleMusic}
            value={MusicPlatform.appleMusic}
            bind:group={platform}
            class="peer hidden"
          />
          <label
            for="apple-music"
            class="block cursor-pointer select-none rounded-xl p-2 text-center peer-checked:bg-apple-music outline:none peer-checked:font-bold peer-checked:text-white"
            >Apple Music</label
          >
        </div>
      </div>
    </div>
    <div class="mt-20 w-full">
      <Button
        type={'no-bg'}
        className={`mx-auto px-6 ${
          platform ? `bg-${platform}` : 'bg-gray-600'
        } ${
          (Capacitor.getPlatform() === 'web' ||
            Capacitor.getPlatform() === 'android') &&
          platform === MusicPlatform.appleMusic &&
          'bg-gray-600 cursor-default'
        }`}
        title="Finish Up"
        on:click={setProvider}
      >
        {#if (Capacitor.getPlatform() === 'web' || Capacitor.getPlatform() === 'android') && platform === MusicPlatform.appleMusic}
          Apple Music is only available on iOS
        {:else}
          Finish Up
        {/if}</Button
      >
    </div>
    <button
      on:click={() => {
        endSession();
        goto('/intro/login');
      }}
      class="mx-auto text-blue-500 underline text-center mt-10">go back</button
    >
  </div>
</main>
