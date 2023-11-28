<script lang="ts">
  import {
    userSubmission,
    insets,
    friendSubmissions,
    user,
    createSubmissionsPlaylist,
  } from '../store';
  import { goto } from '../lib';
  import { MusicPlatform, type Submission as SubmissionType } from '../types';
  import SkeletonSubmission from '../components/submission/Skeleton.svelte';
  import Submission from './submission/index.svelte';
  import UserSubmission from './submission/User.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';

  export let loadingSubmission: boolean;
  export let loadingFriendSubmissions: boolean;
  export let sortedFriendSubmissions: SubmissionType[];

  const sortByDate = (a: SubmissionType, b: SubmissionType) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  };
</script>

<div class="mb-3 mt-3 px-4 mx-auto">
  {#if loadingSubmission}
    <LoadingIndicator className={'mx-auto w-16 h-16'} />
  {:else if $userSubmission.song}
    <UserSubmission data={$userSubmission} />
  {/if}
</div>
<span class="border-white border-t-2 block w-full" />
<div class="my-3" style={`padding-bottom: calc(70px + ${$insets.bottom}px)`}>
  {#if loadingFriendSubmissions}
    <SkeletonSubmission />
    <SkeletonSubmission />
    <SkeletonSubmission />
  {:else if !loadingFriendSubmissions}
    {#each sortedFriendSubmissions.sort(sortByDate) as submission}
      <div class="my-2">
        <Submission data={submission} />
      </div>
    {/each}
    {#if $friendSubmissions?.length === 0}
      <p class="mx-auto text-center mt-3">nobody else has submitted yet.</p>
      <p
        on:keyup={() => goto('/friends')}
        on:click={() => goto('/friends')}
        class="mx-auto text-center text-blue-500 underline"
      >
        add friends.
      </p>
    {/if}
    {#if $user.submissionsPlaylist}
      {#if $user.musicPlatform === MusicPlatform.spotify}
        <a
          href={`https://open.spotify.com/playlist/${$user.submissionsPlaylist}`}
          class="mx-auto text-center mt-3 text-gray-300 underline"
        >
          open your submissions playlist
        </a>
      {:else if $user.musicPlatform === MusicPlatform.appleMusic}
        <a
          href={$user.submissionsPlaylist}
          class="mx-auto text-center mt-3 text-gray-300 underline"
        >
          open your submissions playlist
        </a>
      {/if}
    {:else}
      <p
        on:keyup={createSubmissionsPlaylist}
        on:click={createSubmissionsPlaylist}
        class="mx-auto text-center mt-3 text-gray-300 opacity-70 underline"
      >
        create your dynamic friendsfm playlist.
      </p>
    {/if}
  {/if}
</div>
