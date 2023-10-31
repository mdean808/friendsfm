<script lang="ts">
  import Button from '../components/Button.svelte';
  import { MusicPlatform } from '../types';
  import {
    updateMusicPlatform,
    loading,
    spotifyAuthCode,
    user,
  } from '../store';
  import { goto } from '../lib';
  import { onMount } from 'svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import MusicPlatformIcon from '../components/icons/MusicPlatformIcon.svelte';
  import AppleMusic, {
    AppleMusicPermissionsResults,
  } from '../plugins/AppleMusic';

  let platform: MusicPlatform;

  onMount(async () => {
    if (!user.get().username) goto('/username');
  });

  const setProvider = async () => {
    if (!platform) return;
    loading.set(true);
    if (platform == MusicPlatform.spotify) {
      spotifyAuthCode.listen(async (value: string) => {
        if (await updateMusicPlatform(platform, value)) goto('/');
        loading.set(false);
      });
      const spotifyUrl = `https://accounts.spotify.com/authorize?client_id=${
        import.meta.env.VITE_SPOTIFY_CLIENT_ID
      }&response_type=code&redirect_uri=${
        import.meta.env.VITE_SPOTIFY_REDIRECT_URL
      }&scope=user-read-private%20user-read-currently-playing%20user-read-recently-played%20playlist-modify-private%20playlist-modify-public`;
      window.location.href = spotifyUrl;
    } else if (platform === MusicPlatform.appleMusic) {
      loading.set(false);
      // return toast.push('Apple Music support in development!');
      switch ((await AppleMusic.checkPermissions()).receive) {
        case AppleMusicPermissionsResults.granted:
          console.log('Permissions granted.');
          if (await updateMusicPlatform(platform)) goto('/');
          break;
        case AppleMusicPermissionsResults.prompt: {
          console.log('Permissions not granted');
          const res = await AppleMusic.requestPermissions();
          if (res.receive === AppleMusicPermissionsResults.granted) {
            if (await updateMusicPlatform(platform)) goto('/');
          } else console.log('Permissions denied AGAIN');
          break;
        }
        case AppleMusicPermissionsResults.denied: {
          console.log('Permissions denied');
          const res = await AppleMusic.requestPermissions();
          if (res.receive === AppleMusicPermissionsResults.granted) {
            if (await updateMusicPlatform(platform)) goto('/');
          } else console.log('Permissions denied AGAIN');
          break;
        }
        default: {
          const res = await AppleMusic.requestPermissions();
          if (res.receive === AppleMusicPermissionsResults.granted) {
            if (await updateMusicPlatform(platform)) goto('/');
          } else console.log('Permissions denied AGAIN');
          break;
        }
      }
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
            id="spotify"
            value="spotify"
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
            value="apple-music"
            bind:group={platform}
            id="apple-music"
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
        type="muted"
        className={`mx-auto px-6 ${
          platform === MusicPlatform.spotify
            ? 'bg-spotify'
            : platform === MusicPlatform.appleMusic
            ? 'bg-apple-music'
            : 'bg-gray-600'
        }`}
        title="Finish Up"
        on:click={setProvider}>Finish Up</Button
      >
    </div>
    <button
      on:click={() => goto('/new_user')}
      class="mx-auto text-blue-500 underline text-center mt-10">go back</button
    >
  </div>
</main>
