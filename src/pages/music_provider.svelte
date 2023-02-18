<script lang="ts">
  import Button from '../components/Button.svelte';

  import { MusicPlatform } from '../types';
  import { updateMusicPlatform, loading, spotifyAccessToken } from '../store';
  import { goto } from '../lib';

  let platform: MusicPlatform;
  const setProvider = async () => {
    if (!platform) return;
    loading.set(true);
    if (platform == MusicPlatform.spotify) {
      spotifyAccessToken.listen(async (value: string) => {
        if (await updateMusicPlatform(platform, value)) goto('/');
      });
      const spotifyUrl = `https://accounts.spotify.com/authorize?client_id=${
        import.meta.env.VITE_SPOTIFY_CLIENT_ID
      }&response_type=code&redirect_uri=${
        import.meta.env.VITE_SPOTIFY_REDIRECT_URL
      }&scope=user-read-private%20user-read-currently-playing`;
      window.location.href = spotifyUrl;
    } else if (platform === MusicPlatform.appleMusic) {
      //todo: authenticate with appleMusic
      if (await updateMusicPlatform(platform)) goto('/');
    }
    loading.set(false);
  };
</script>

<main class="text-center mx-auto w-full">
  <div class="mx-auto py-6 px-4 w-full">
    <h1 class="text-4xl">Select a Platform</h1>
    <p class="text-lg text-gray-400">
      Choose the service you use to listen to music the most.
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
            class="block cursor-pointer select-none rounded-xl p-2 text-center outline:none peer-checked:bg-spotify peer-checked:font-bold peer-checked:text-white"
            >Spotify</label
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
      <p class="text-sm text-gray-400 text-left pl-1">
        So and so is a registered trademark of so and so
      </p>
    </div>
    <div class="mt-20 w-full">
      <Button
        type="muted"
        className={`mx-auto px-6 ${
          platform === 'spotify'
            ? 'bg-spotify'
            : platform === 'apple-music'
            ? 'bg-apple-music'
            : 'bg-gray-600'
        }`}
        title="Finish Up"
        on:click={setProvider}>Finish Up</Button
      >
    </div>
  </div>
</main>
