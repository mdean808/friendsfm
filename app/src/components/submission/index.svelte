<script lang="ts">
  import { goto } from '../../lib/util';
  import type { SavedSong, Song, Submission } from '../../types';
  import {
    activeSubmission,
    getUserCurrentlyListening,
    publicProfileUsername,
    songs,
    toggleSong,
  } from '../../store';
  import SubmissionSong from './Song.svelte';
  import SubmissionTime from './Time.svelte';
  import SubmissionActions from './Actions.svelte';
  import Comment from '../icons/Comment.svelte';
  import { onDestroy, onMount } from 'svelte';
  import Heart from '../icons/Heart.svelte';

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
    const savedSong: SavedSong = {
      ...data.song,
      user: {
        id: data.user.id,
        username: data.user.username,
        musicPlatform: data.user.musicPlatform,
      },
    };
    await toggleSong(savedSong, data.id);
    loadingHeart = false;
  };
</script>

<div
  on:keypress={showFullSubmission}
  on:click={showFullSubmission}
  class={`border-white rounded-lg shadow-2xl bg-gray-700`}
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
  <div class="relative">
    <!-- BLUE DURATION BACKGROUND -->
    {#if data.song.timestamp === 0}
      <div
        style={`width: ${
          (data.song.durationElapsed / data.song.length) * 100
        }%`}
        class="absolute left-0 right-0 h-full bg-blue-700 opacity-80 z-0"
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

  <div class={`flex rounded-b-lg border-t border-gray-400 bg-gray-700`}>
    <div
      on:click={toggleHeart}
      on:keypress={toggleHeart}
      class="text-white py-1 flex gap-2 place-content-center text-center w-full truncate border-r border-gray-400"
    >
      <Heart
        className={`w-6 h-6 flex-grow-0 flex-shrink ${
          loadingHeart ? 'animate-ping text-white' : ''
        } ${
          $songs.find((s) => s.name === data.song.name) ? 'text-white' : ''
        } `}
        fill={$songs.find((s) => s.name === data.song.name)
          ? 'currentColor'
          : 'none'}
      />
      <span class="mt-0.5">{data.likes || 0} likes</span>
    </div>
    <div
      class="text-white py-1 flex gap-2 place-content-center text-center w-full truncate"
    >
      <Comment className="w-6 h-6" />
      <span class="mt-0.5"> {data.comments.length} comments</span>
    </div>
  </div>
</div>
