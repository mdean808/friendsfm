<script lang="ts">
  // IMPORTS
  import { onMount } from 'svelte';
  import {
    user,
    logout,
    statusBarHeight,
    bottomInset,
    friendSubmissions,
    loading,
    generateSubmission,
    userSubmission,
    getSubmissionStatus,
    authToken,
  } from '../store';
  import Button from '../components/Button.svelte';
  import { goto } from '../lib';
  import Submission from '../components/Submission.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import SkeletonSubmission from '../components/SkeletonSubmission.svelte';

  // GLOBALS
  let loadingSubmissions = false;

  authToken.listen(async (value) => {
    if (value) {
      loadingSubmissions = true;
      await getSubmissionStatus();
      loadingSubmissions = false;
    }
  });

  const createSubmission = async () => {
    loading.set(true);
    await generateSubmission();
    loading.set(false);
  };
</script>

<div
  style={`margin-top: ${8 + $statusBarHeight}px; margin-bottom: ${
    $bottomInset + 50
  }px`}
  class="text-center w-full"
>
  <div
    style={`height: calc(100vh - ${60 + $statusBarHeight}px - ${
      55 + $bottomInset
    }px)`}
    class="py-2 px-4 overflow-y-scroll overflow-x-hidden"
  >
    <h2>Hello, {$user?.username}!</h2>
    <div class="my-2">
      {#if loadingSubmissions}
        <SkeletonSubmission />
      {:else if $userSubmission.song}
        <Submission data={$userSubmission} />
      {/if}
    </div>
    <span class="border-white border-t-2 block w-full" />
    <div class="my-2">
      {#if loadingSubmissions}
        <LoadingIndicator className={'mx-auto w-16 h-16'} />
      {:else if !$friendSubmissions.length && !$userSubmission.song}
        <h3>Looks like you're the only one listening right now!</h3>
        <Button
          type="primary"
          title="Share current song."
          on:click={createSubmission}>Share Current Song</Button
        >
      {:else}
        {#each $friendSubmissions as submission}
          <Submission data={submission} />
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
</div>
