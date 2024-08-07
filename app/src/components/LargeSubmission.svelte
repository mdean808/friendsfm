<script lang="ts">
  import type { Song, Submission } from '$lib/types';
  import SubmissionTime from './submission/Time.svelte';
  import SubmissionActions from './submission/Actions.svelte';
  import Comment from '$components/icons/Comment.svelte';
  import Heart from '$components/icons/Heart.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { activeSubmission, toggleLike } from '$lib/submission';
  import { goto } from '$app/navigation';
  import { getCurrentSong } from '$lib/user';
  import { publicProfileUsername } from '$lib/util';
  import { session } from '$lib/session';
  import { FirebaseFirestore } from '@capacitor-firebase/firestore';

  export let data: Submission;

  let currentlyListening: Song | undefined;
  let interval: NodeJS.Timeout;
  let loadingHeart = false;

  const showFullSubmission = () => {
    activeSubmission.set(data);
    goto('/modal/submission');
  };

  onMount(async () => {
    currentlyListening = await getCurrentSong(data.user.id);
    // get current listening every 15 seconds
    interval = setInterval(async () => {
      currentlyListening = await getCurrentSong(data.user.id);
    }, 15000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });

  const toggleLikeHandler = async (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    if (loadingHeart) return;
    loadingHeart = true;
    await toggleLike(data);
    loadingHeart = false;
  };
</script>

<div
  on:keypress={showFullSubmission}
  on:click={showFullSubmission}
  role="button"
  tabindex="0"
  class={`rounded-lg shadow-2xl bg-gray-700`}
>
  <!-- HEADER -->
  <div
    class={`flex gap-2 p-2 rounded-t-lg ${
      currentlyListening
        ? `bg-gradient-to-r from-${data.user.musicPlatform} via-blue-500 to-${data.user.musicPlatform} background-animate`
        : `bg-${data.user.musicPlatform}`
    }`}
  >
    <div class="flex-grow-0 w-full text-left">
      <button
        on:click={(e) => {
          e.stopPropagation();
          publicProfileUsername.set(data.user.username);
          goto('/modal/profile');
        }}
        class="text-left w-full flex gap-2 mb-1"
      >
        <h4 class="text-xl truncate">
          <img
            class="w-5 h-5 inline rounded-full"
            src={`https://icotar.com/avatar/${
              data.user?.username || 'undefined'
            }.svg`}
            alt="avatar"
          />
          {data.user ? data.user.username : 'Unknown'}
        </h4>
        <SubmissionActions className="ml-auto" {data} />
      </button>
      {#if data?.caption}
        <p class="italic break-word text-sm">
          {data.caption}
        </p>
      {/if}
    </div>
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
      on:click={toggleLikeHandler}
      on:keypress={toggleLikeHandler}
      role="button"
      tabindex="0"
      class="text-white py-1 flex gap-2 place-content-center text-center w-full truncate border-r border-white"
    >
      <Heart
        className={`w-6 h-6 flex-grow-0 flex-shrink ${
          loadingHeart ? 'animate-ping text-white' : ''
        } ${data.likes?.find((l) => l.id === $session.user.id) ? 'text-white' : ''} `}
        fill={data.likes?.find((l) => l.id === $session.user.id)
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
