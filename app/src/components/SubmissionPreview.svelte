<script lang="ts">
  import type { MusicPlatform, Submission } from '../types';
  import SubmissionSong from './submission/Song.svelte';
  import SubmissionTime from './submission/Time.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '../lib/util';
  import { user, previewSubmission, publicProfileUsername } from '../store';

  let submission: Submission;
  let interval: NodeJS.Timeout;
  let loading = true;
  let friends: {
    id: string;
    username: string;
    musicPlatform: MusicPlatform;
    currentlyListening: boolean;
  }[] = [];

  onMount(async () => {
    const res = await previewSubmission();
    if (!res) return;
    submission = res.submission;
    friends = res.friends;
    loading = false;
    // update the preview every 15 seconds
    interval = setInterval(async () => {
      const res = await previewSubmission();
      submission = res.submission;
      friends = res.friends;
    }, 10000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class={`border-white rounded-lg shadow-lg bg-gray-700`}>
  <!-- HEADER -->
  <div
    class={`flex p-2 rounded-t-lg ${
      submission?.song?.timestamp === 0
        ? `bg-gradient-to-r from-${$user.musicPlatform} via-blue-500 to-${$user.musicPlatform} background-animate`
        : `bg-${$user.musicPlatform}`
    }`}
  >
    <div class="flex-grow text-center">
      <h4 class="text-lg">submission preview</h4>
    </div>
  </div>
  {#if submission && submission?.song}
    <!-- SONG -->
    <div class="relative">
      <!-- BLUE DURATION BACKGROUND -->
      {#if submission.song.timestamp === 0}
        <div
          style={`
      width: ${
        (submission.song.durationElapsed / submission.song.length) * 100
      }%
      `}
          class="absolute rounded-bl-lg left-0 right-0 h-full bg-blue-700 opacity-80 z-0"
        />
      {/if}
      <div class="sticky">
        <div class="px-2 py-1">
          <div class="w-full text-left">
            <SubmissionTime className="truncate w-full" data={submission} />
          </div>
          <SubmissionSong data={submission} />
        </div>
      </div>
    </div>
  {:else}
    <div class="p-2 animate-pulse">
      <p class="h-4 mb-1 rounded-md bg-gray-500 w-1/4" />
      <div class="flex gap-2">
        <div class="h-12 w-12 rounded-md bg-gray-500"></div>
        <div class="w-48 flex justify-center align-middle flex-col">
          <p class="h-4 mb-1 rounded-md bg-gray-500 w-2/3" />
          <p class="h-4 rounded-md bg-gray-500 w-1/3" />
        </div>
      </div>
    </div>
  {/if}
</div>

<div class="my-2 border-t-2 border-white relative py-2">
  {#each friends as friend}
    <div
      class={`flex p-2 rounded-t-lg ${
        friend?.currentlyListening
          ? `bg-gradient-to-r from-${friend?.musicPlatform} via-blue-500 to-${friend?.musicPlatform} background-animate`
          : `bg-gray-500`
      }`}
    >
      <button
        on:click={(e) => {
          e.stopPropagation();
          goto('/public_profile');
          publicProfileUsername.set(friend.username);
        }}
        class="flex-grow text-left"
      >
        <img
          class="w-5 h-5 inline rounded-full"
          src={`https://icotar.com/avatar/${
            friend?.username || 'undefined'
          }.svg`}
          alt="avatar"
        />
        {friend ? friend?.username : 'Unknown'}
      </button>
    </div>
    <div class="relative p-2 bg-gray-700 text-left mb-2 rounded-b-lg">
      <div
        class="absolute backdrop-blur-md w-full h-full rounded-b-lg left-0 top-0"
      />
      <p class="mb-1 text-sm text-gray-400">played yesterday at 12:30</p>
      <div class="flex gap-2">
        <img
          class="w-12 h-12 inline rounded-lg"
          src={`https://icotar.com/avatar/album-${
            friend?.username || 'undefined'
          }.svg`}
          alt="avatar"
        />
        <div class="w-48 flex justify-center align-middle flex-col">
          <p class={`h-4 mb-1 text-${friend?.musicPlatform}`}>Cool Song Name</p>
          <p class="h-4">Cool Artist Name</p>
        </div>
      </div>
    </div>
  {/each}
</div>
