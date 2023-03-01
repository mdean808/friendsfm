<script lang="ts">
  // IMPORTS
  import { onMount, onDestroy } from 'svelte';
  import {
    friendSubmissions,
    loading,
    generateSubmission,
    userSubmission,
    getSubmissionStatus,
    authToken,
    currPath,
    user,
    toggleSong,
    songs,
  } from '../store';
  import { slide } from 'svelte/transition';
  import Button from '../components/Button.svelte';
  import Submission from '../components/Submission.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import SkeletonSubmission from '../components/SkeletonSubmission.svelte';
  import { formatDurationPlayed, formatTimePlayed, goto } from '../lib';

  // GLOBALS
  let loadingSubmissions = true;

  onMount(async () => {
    // setup pull to refresh
    document.addEventListener('touchstart', swipeStart, false);
    document.addEventListener('touchmove', swipeMove, false);
    document.addEventListener('touchend', swipeEnd, false);
    if (!authToken.get()) {
      authToken.listen(async (value) => {
        if (value && currPath.get() == '/') {
          loadingSubmissions = true;
          await getSubmissionStatus();
          loadingSubmissions = false;
        }
      });
    } else if (!userSubmission.get()?.song) {
      loadingSubmissions = true;
      await getSubmissionStatus();
    }
    loadingSubmissions = false;
  });

  const createSubmission = async () => {
    loading.set(true);
    await generateSubmission();
    loading.set(false);
  };

  const swipePosStart = { x: 0, y: 0 };
  const swipePosCurrent = { x: 0, y: 0 };
  let shouldRefreshOnSwipeEnd = false;

  const swipeStart = (e: TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      swipePosStart.x = touch.screenX;
      swipePosStart.y = touch.screenY;
    }
  };

  const swipeMove = (e: TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      swipePosCurrent.x = touch.screenX;
      swipePosCurrent.y = touch.screenY;
    }
    const changeInY = swipePosCurrent.y - swipePosStart.y;
    if (document.getElementById('home')?.scrollTop <= 0 && changeInY > 100)
      shouldRefreshOnSwipeEnd = true;
    else shouldRefreshOnSwipeEnd = false;
  };

  const swipeEnd = async () => {
    if (shouldRefreshOnSwipeEnd && !loadingSubmissions) {
      loadingSubmissions = true;
      await getSubmissionStatus();
      loadingSubmissions = false;
      shouldRefreshOnSwipeEnd = false;
    }
  };

  onDestroy(() => {
    document.addEventListener('touchstart', swipeStart, false);
    document.addEventListener('touchmove', swipeMove, false);
    document.addEventListener('touchend', swipeEnd, false);
  });
</script>

<div
  id="home"
  class="text-center w-full py-2 px-4 overflow-y-auto"
  style="height: inherit;"
>
  {#if shouldRefreshOnSwipeEnd && !loadingSubmissions}
    <div transition:slide class="mx-auto">
      <p class="mx-auto w-fit py-0.5 px-3 rounded-lg bg-gray-900 animate-pulse">
        release to refresh
      </p>
    </div>
  {/if}
  <div class="mb-3">
    {#if loadingSubmissions}
      <LoadingIndicator className={'mx-auto w-16 h-16'} />
    {:else if $userSubmission.song}
      {#if !$userSubmission.late}
        <span class="text-sm text-gray-400"
          >{new Date($userSubmission.time).toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          })}
        </span>
      {:else}
        <span class="text-sm text-red-500"
          >{new Date($userSubmission.time).toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          })}
        </span>
      {/if}
      <div
        class="border-2 border-gray-600 rounded-md w-fit mx-auto my-1 py-2 text-left space-x-4 flex px-2"
      >
        <a href={$userSubmission.song.url} class="flex-grow">
          <div>
            <p class={`text-${$user.musicPlatform}`}>
              {$userSubmission.song.name}
            </p>
            <p>{$userSubmission.song.artist}</p>
          </div>
        </a>
        <div class="flex-grow-0 flex-shrink-0">
          <svg
            on:click={() => toggleSong($userSubmission.song)}
            on:keypress={() => toggleSong($userSubmission.song)}
            class={`w-6 h-6 ml-auto flex-grow-0 flex-shrink ${
              $songs.find((s) => s.name === $userSubmission.song.name)
                ? 'text-pink-500'
                : ''
            } `}
            fill={$songs.find((s) => s.name === $userSubmission.song.name)
              ? 'currentColor'
              : 'none'}
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
      <p class="text-gray-400">
        {#if $userSubmission.song.timestamp > 0}
          played at {formatTimePlayed($userSubmission.song.timestamp)}
        {:else}
          {formatDurationPlayed($userSubmission.song.durationElapsed)} of {formatDurationPlayed(
            $userSubmission.song.length
          )} played
        {/if}
      </p>
    {/if}
  </div>
  {#if !loadingSubmissions && !$userSubmission.song}
    <h3>you haven't shared what you're listening to yet.</h3>
    <h4 class="mb-2">submit to see what your friends are playing!</h4>
  {/if}
  <span class="border-white border-t-2 block w-full" />
  <div class="my-2">
    {#if loadingSubmissions}
      <SkeletonSubmission />
    {:else if !loadingSubmissions && !$userSubmission.song}
      <Button
        type="primary"
        className="mb-2"
        title="Share current song."
        on:click={createSubmission}>Share Current Song</Button
      >
    {:else}
      {#each $friendSubmissions as submission}
        <div class="my-2">
          <Submission data={submission} />
        </div>
      {/each}
      {#if $friendSubmissions.length === 0}
        <p class="mx-auto text-center mt-3">nobody else has submitted yet.</p>
        <p
          on:keyup={() => goto('/friends')}
          on:click={() => goto('/friends')}
          class="mx-auto text-center text-blue-500 underline"
        >
          add friends for more submissions.
        </p>
      {/if}
    {/if}
  </div>
</div>
