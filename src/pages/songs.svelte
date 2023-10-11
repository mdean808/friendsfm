<script lang="ts">
  import { onMount } from 'svelte';
  import { formatDurationPlayed, getPlatformColor } from '../lib';
  import { loadSongs, songs, toggleSong, user, header, insets } from '../store';

  let loadingSongs = false;
  onMount(async () => {
    header.set('songs');
    if (loadingSongs || !songs.get() || songs.get().length !== 0) return;
    loadingSongs = true;
    await loadSongs();
    loadingSongs = false;
  });
</script>

<div
  class="h-full overflow-y-scroll"
  style={`padding-bottom: calc(70px + ${$insets.bottom}px)`}
>
  <div class="mx-4 py-1 text-center border-b-2 border-gray-400"></div>
  {#if loadingSongs}
    <div
      class="text-left mt-2 px-2 mx-4 border-b-2 border-gray-400 py-2 mb-2 space-x-4"
    >
      <div class="animate-pulse flex space-x-4">
        <div class="flex-grow">
          <p class="text-xl mb-2 h-4 w-2/3 rounded-md bg-gray-700" />
          <p class="text-xl mb-2 h-3 w-1/3 rounded-md bg-gray-700" />
          <p class="text-xl mb-2 h-2.5 w-1/5 rounded-md bg-gray-700" />
        </div>
        <div class="flex-grow-0 flex-shrink">
          <svg
            class="w-6 h-6 ml-auto flex-grow-0 flex-shrink text-gray-700"
            fill="currentColor"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            /></svg
          >
        </div>
      </div>
    </div>
  {:else}
    {#if $songs.length === 0}
      <p class="text-gray-500 mx-auto text-center mt-2">
        you have no saved songs
      </p>
    {/if}
    {#each $songs as song}
      <div
        class="text-left px-2 mx-4 border-b-2 border-gray-400 py-2 mb-2 flex space-x-4"
      >
        <a href={song.url} class="flex flex-grow items-center">
          {#if song.albumArtwork}
            <div>
              <img
                alt="Album Artwork"
                class="w-16 h-16 mr-3 rounded-sm"
                src={song.albumArtwork}
              />
            </div>
          {/if}
          <div class={song.albumArtwork ? 'w-52' : 'w-64'}>
            <h1
              class={`truncate text-${getPlatformColor($user.musicPlatform)}`}
            >
              {song.name}
            </h1>
            <p class="text-white truncate">
              {song.artist}
            </p>
            <p class="text-sm truncate text-gray-500">
              {#if song.user?.username}
                {song.user?.username}
              {:else}
                {formatDurationPlayed(song.length)}
              {/if}
            </p>
          </div>
        </a>
        <div class="flex-grow-0 flex-shrink">
          <svg
            on:click={() => toggleSong(song)}
            on:keypress={() => toggleSong(song)}
            class="w-6 h-6 ml-auto flex-grow-0 flex-shrink text-pink-500"
            fill="currentColor"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            /></svg
          >
        </div>
      </div>
    {/each}
  {/if}
</div>
