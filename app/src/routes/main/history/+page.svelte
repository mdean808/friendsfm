<script lang="ts">
  import {onDestroy, onMount} from 'svelte';
  import {insets} from '$lib/device';
  import {currSubNumber, loadingFriendSubmissions, sortByDate} from "$lib/util";
  import {loadFriendSubmissions, loadUserSubmission, friendSubmissions, userSubmission} from "$lib/submission";
  import {slide} from "svelte/transition";
  import {getShortDate} from "$lib/dates";

  import SkeletonSubmission from "$components/submission/Skeleton.svelte";
  import LargeSubmission from "$components/LargeSubmission.svelte";
  import type {Submission} from "$lib/types";
  import UserSubmission from "$components/submission/User.svelte";
  import {get} from "svelte/store";

  const currFriendSubmissions = get(friendSubmissions)
  const currUserSubmission = get(userSubmission)
  let loadingHistory = false;
  let currentDay = $currSubNumber - 1;
  let sortedFriendSubmissions: Submission[];
  $: currentDate = new Date(new Date().setDate(new Date().getDate() - ($currSubNumber - currentDay)))

  friendSubmissions.subscribe((val) => {
    if (val) sortedFriendSubmissions = [...val].sort(sortByDate);
    if (val?.length > 0) loadingFriendSubmissions.set(false);
  });

  onMount(async () => {
    if (loadingHistory) return;
    loadingHistory = true;
    await loadUserSubmission(currentDay)
    await loadFriendSubmissions(currentDay)
    loadingHistory = false;
  });

  onDestroy(async () => {
    userSubmission.set(currUserSubmission)
    friendSubmissions.set(currFriendSubmissions)
  })

  const getPreviousDay = async () => {
    currentDay--
    await loadUserSubmission(currentDay)
    await loadFriendSubmissions(currentDay)
  }

  const getNextDay = async () => {
    if (currentDay + 1 === $currSubNumber) return;
    currentDay++;
    await loadUserSubmission(currentDay)
    await loadFriendSubmissions(currentDay)
  }

</script>

<div
    style={`height: calc(100vh - ${64 + $insets.bottom + $insets.top}px); padding-bottom: calc(70px + ${$insets.bottom}px)`}
    class="overflow-y-scroll"
>
  <div class="px-4">
    <div class="flex pt-2 pb-1 px-2">
      <button
          on:click={getPreviousDay}
          class="text-transparent"
      >
        <svg
            class={`flex-end w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-blue-500`}
            data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"></path>
        </svg>
      </button>
      <h2 class="text-xl flex-grow text-center text-gray-300">{getShortDate(currentDate)}</h2>
      <button
          on:click={getNextDay}
          class="text-transparent"
      >
        <svg
            class={`flex-start w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 ${currentDay + 1 === $currSubNumber ? 'text-gray-400' : 'text-blue-500'}`}
            data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"></path>
        </svg>
      </button>
    </div>
    <div class="mx-4 py-1 text-center"></div>
    {#if loadingHistory}
      <div class="my-2 border-b-2 border-gray-400">
        <SkeletonSubmission type="user"/>
      </div>
      <div class="my-2">
        <SkeletonSubmission/>
        <SkeletonSubmission/>
        <SkeletonSubmission/>
      </div>
    {:else if !$userSubmission}
      <p class="text-center w-full">you did not submit on this day</p>
    {:else}
      <div class="my-2 px-2 pb-2 border-b-2 border-gray-400">
        <UserSubmission data={$userSubmission}/>
      </div>
      {#each sortedFriendSubmissions as submission}
        <div in:slide class="my-4">
          <LargeSubmission data={submission}/>
        </div>
      {/each}
      {#if $friendSubmissions?.length === 0}
        <p class="mx-auto text-center mt-3">nobody submitted on this day</p>
      {/if}
    {/if}
  </div>
</div>
