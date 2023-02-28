<script lang="ts">
  // IMPORTS
  import { onMount, onDestroy } from 'svelte';
  import {
    logout,
    friendSubmissions,
    loading,
    generateSubmission,
    userSubmission,
    getSubmissionStatus,
    authToken,
    currPath,
  } from '../store';
  import { slide } from 'svelte/transition';
  import Button from '../components/Button.svelte';
  import { goto } from '../lib';
  import Submission from '../components/Submission.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import SkeletonSubmission from '../components/SkeletonSubmission.svelte';

  // GLOBALS
  let loadingSubmissions = false;

  // MOUNT

  onMount(async () => {
    // setup pull to refresh
    document.addEventListener('touchstart', swipeStart, false);
    document.addEventListener('touchmove', swipeMove, false);
    document.addEventListener('touchend', swipeEnd, false);
    // TODO: make this only run on load -- sometimes it causes issues with premature calls
    authToken.listen(async (value) => {
      if (value && currPath.get() == '/') {
        loadingSubmissions = true;
        await getSubmissionStatus();
        loadingSubmissions = false;
      }
    });
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
  <div class="my-2">
    {#if loadingSubmissions}
      <SkeletonSubmission />
    {:else if $userSubmission.song}
      <Submission data={$userSubmission} />
    {/if}
  </div>
  {#if !loadingSubmissions && !$userSubmission.song}
    <h3>you haven't shared what you're listening to yet.</h3>
    <h4 class="mb-2">submit late to see what your friends are playing!</h4>
  {/if}
  <span class="border-white border-t-2 block w-full" />
  <div class="my-2">
    {#if loadingSubmissions}
      <LoadingIndicator className={'mx-auto w-16 h-16'} />
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
    {/if}
    <Button
      className="mt-2"
      type="primary"
      title="reset"
      on:click={async () => {
        goto('/new_user');
        await logout();
      }}>Reset</Button
    >
  </div>
</div>
