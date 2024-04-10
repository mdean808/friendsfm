<script lang="ts">
  import { goto } from '../lib/util';
  import type { Song, Submission } from '../types';
  import {
    activeSubmission,
    getUserCurrentlyListening,
    publicProfileUsername,
    toggleLike,
    user,
  } from '../store';
  import SubmissionTime from './submission/Time.svelte';
  import SubmissionActions from './submission/Actions.svelte';
  import Comment from './icons/Comment.svelte';
  import Heart from './icons/Heart.svelte';
  import { onDestroy, onMount } from 'svelte';

  export let data: Submission;

  let currentlyListening: Song;
  let interval: NodeJS.Timeout;
  let loadingHeart = false;

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

  const toggleHeart = async (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    if (loadingHeart) return;
    loadingHeart = true;
    data.likes = await toggleLike(data.id);
    loadingHeart = false;
  };
</script>

<div
  on:keypress={showFullSubmission}
  on:click={showFullSubmission}
  class={`rounded-lg shadow-2xl bg-gray-700`}
>
  <!-- HEADER -->
  <div
    class={`flex p-2 rounded-t-lg ${
      currentlyListening
        ? `bg-gradient-to-r from-${data.user.musicPlatform} via-blue-500 to-${data.user.musicPlatform} background-animate`
        : `bg-${data.user.musicPlatform}`
    }`}
  >
    <div class="flex-grow text-left">
      <button
        on:click={(e) => {
          e.stopPropagation();
          goto('/public_profile');
          publicProfileUsername.set(data.user.username);
        }}
        class="text-left w-full"
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
      {#if data?.caption}
        <p class="truncate italic text-sm">
          {data.caption}
        </p>
      {/if}
    </div>
    <SubmissionActions {data} />
  </div>
  <!-- SONG -->
  <div>
    <div
      class="bg-no-repeat bg-cover aspect-square"
      style={`background-image: url('${data.song.albumArtwork}');`}
    >
      <div class="flex w-full items-end h-full text-center">
        <div
          class="relative p-2 rounded-md backdrop-blur-lg bg-gray-800 border-white shadow-md bg-opacity-60 border mx-auto mb-10 w-4/5"
        >
          <!-- BLUE DURATION BACKGROUND -->
          {#if data.song.timestamp === 0}
            <div
              style={`width: ${
                (data.song.durationElapsed / data.song.length) * 100
              }%`}
              class="absolute rounded-l-md left-0 top-0 h-full bg-blue-700 opacity-50 z-0"
            />
          {/if}
          <div class="sticky z-10">
            <SubmissionTime className="truncate w-full" {data} />
            <h2 class={`text-xl text-white`}>
              {data.song.name}
            </h2>
            <h2 class="text-white">{data.song.artist}</h2>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    class={`flex rounded-b-lg ${
      currentlyListening
        ? `bg-gradient-to-r from-${data.user.musicPlatform} via-blue-500 to-${data.user.musicPlatform} background-animate`
        : `bg-${data.user.musicPlatform}`
    }`}
  >
    <div
      on:click={toggleHeart}
      on:keypress={toggleHeart}
      class="text-white py-1 flex gap-2 place-content-center text-center w-full truncate border-r border-white"
    >
      <Heart
        className={`w-6 h-6 flex-grow-0 flex-shrink ${
          loadingHeart ? 'animate-ping text-white' : ''
        } ${data.likes?.find((l) => l.id === $user.id) ? 'text-white' : ''} `}
        fill={data.likes?.find((l) => l.id === $user.id)
          ? 'currentColor'
          : 'none'}
      />
      <span class="mt-0.5">
        {data.likes?.length || 0} like{#if data.likes?.length !== 1}s{/if}
      </span>
    </div>
    <div
      class="text-white py-1 flex gap-2 place-content-center text-center w-full truncate"
    >
      <Comment className="w-6 h-6" />
      <span class="mt-0.5">
        {data.comments.length} comment{#if data.comments.length !== 1}s{/if}
      </span>
    </div>
  </div>
</div>
