<script lang="ts">
  import { goto } from '../../lib/util';
  import type { Song, Submission } from '../../types';
  import {
    activeSubmission,
    getUserCurrentlyListening,
    publicProfileUsername,
  } from '../../store';
  import SubmissionSong from './Song.svelte';
  import SubmissionTime from './Time.svelte';
  import SubmissionActions from './Actions.svelte';
  import { onDestroy, onMount } from 'svelte';

  export let data: Submission;

  let currentlyListening: Song;
  let interval: NodeJS.Timeout;

  const showFullSubmission = () => {
    activeSubmission.set(data);
    goto('/?submission');
  };

  onMount(async () => {
    currentlyListening = await getUserCurrentlyListening(data.user.id);
    // get current listening every 15 seconds
    interval = setInterval(async () => {
      currentlyListening = await getUserCurrentlyListening(data.user.id);
    }, 15000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div
  on:keypress={showFullSubmission}
  on:click={showFullSubmission}
  class={`border-white rounded-lg shadow-lg bg-gray-700`}
>
  <!-- HEADER -->
  <div
    class={`flex p-2 rounded-t-lg ${
      currentlyListening
        ? `bg-gradient-to-r from-${data.user.musicPlatform} via-blue-500 to-${data.user.musicPlatform} background-animate`
        : `bg-${data.user.musicPlatform}`
    }`}
  >
    <button
      on:click={(e) => {
        e.stopPropagation();
        goto('/public_profile');
        publicProfileUsername.set(data.user.username);
      }}
      class="flex-grow text-left"
    >
      <h4 class="text-xl">
        <img
          class="w-5 h-5 inline rounded-full"
          src={`https://icotar.com/avatar/${
            data.user?.username || 'undefined'
          }.svg`}
          alt="avatar"
        />
        {data.user ? data.user.username : 'Unknown'}
      </h4>
    </button>
    <SubmissionActions
      commentNumberColor={`text-${data.user?.musicPlatform}`}
      {data}
    />
  </div>
  <!-- SONG -->
  <div class="relative">
    <!-- BLUE DURATION BACKGROUND -->
    {#if data.song.timestamp === 0}
      <div
        style={`
      width: ${(data.song.durationElapsed / data.song.length) * 100}%
      `}
        class="absolute rounded-bl-lg left-0 right-0 h-full bg-blue-700 opacity-80 z-0"
      />
    {/if}
    <div class="sticky">
      <div class="px-2 py-1">
        <div class="w-full text-left">
          <SubmissionTime className="truncate w-full" {data} />
        </div>
        <SubmissionSong {data} />
      </div>
    </div>
  </div>
</div>
