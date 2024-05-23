<script lang="ts">
  import { onMount } from 'svelte';
  import MusicPlatformIcon from '$components/icons/MusicPlatformIcon.svelte';
  import { session } from '$lib/session';
  import type { SavedSong } from '$lib/types';
  import { insets } from '$lib/device';
  import { toggleSavedSong } from '$lib/songs';
  import { formatDurationPlayed } from '$lib/dates';
  import { FirebaseFirestore } from '@capacitor-firebase/firestore';

  let loadingSongs = false;
  onMount(async () => {
    if (loadingSongs || !$session.songs || $session.songs.length !== 0) return;
    loadingSongs = true;
    const songs = await FirebaseFirestore.getCollection({
      reference: `users/${$session.user.id}/songs`,
    });
    try {
      songs.snapshots.forEach((doc) => {
        const song = doc.data as SavedSong;
        session.update((s) => {
          s.songs.push({ ...song, id: doc.id });
          return s;
        });
      });
    } catch (e) {
      console.log('no songs found');
    } finally {
      loadingSongs = false;
    }
  });
</script>

<div
  style={`height: calc(100vh - ${64 + $insets.bottom + $insets.top}px); padding-bottom: calc(70px + ${$insets.bottom}px)`}
>
  <div>
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
      {#if $session.songs.length === 0}
        <p class="text-gray-500 mx-auto text-center mt-2">
          you have no saved songs
        </p>
      {/if}
      {#each $session.songs as song}
        <div
          class="text-left px-2 mx-4 border-b-2 border-gray-400 py-2 mb-2 flex space-x-4"
        >
          <a
            href={song.platforms?.find(
              (p) => p.id === $session.user.public.musicPlatform
            )?.url || song.url}
            class="flex flex-grow items-center"
          >
            {#if song.albumArtwork}
              <div>
                <img
                  alt="Album Artwork"
                  class="w-16 h-16 mr-3"
                  src={song.albumArtwork}
                />
              </div>
            {/if}
            <div class={song.albumArtwork ? 'w-52' : 'w-64'}>
              <h1 class={`truncate text-${$session.user.public.musicPlatform}`}>
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
          <div
            class="inline-flex flex-grow-0 flex-shrink flex-col justify-between"
          >
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <svg
              on:click={() => toggleSavedSong(song)}
              on:keypress={() => toggleSavedSong(song)}
              class="w-6 h-6 ml-auto self-start text-pink-500"
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
            <div class="mb-1.5 p-0.5 w-6 h-6 self-end">
              <MusicPlatformIcon
                className=""
                id={$session.user.public.musicPlatform || 'spotify'}
              />
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
