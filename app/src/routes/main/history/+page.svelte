<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { insets } from '$lib/device';
  import {
    currSubNumber,
    historyCurrentDay,
    sortByDate,
  } from '$lib/util';
  import { loadFriendSubmissions, friendSubmissions } from '$lib/submission';
  import { slide, fly } from 'svelte/transition';
  import { getShortDate } from '$lib/dates';

  import SkeletonSubmission from '$components/submission/Skeleton.svelte';
  import LargeSubmission from '$components/LargeSubmission.svelte';
  import { MusicPlatform, type Submission } from '$lib/types';
  import UserSubmission from '$components/submission/User.svelte';
  import { get } from 'svelte/store';
  import { userSubmissionFilter } from '$lib/filters';
  import { FirebaseFirestore } from '@capacitor-firebase/firestore';
  import { session } from '$lib/session';

  const currFriendSubmissions = $friendSubmissions;
  let direction: 'left' | 'right' = 'left';
  let loadingHistory = false;
  let sortedFriendSubmissions: Submission[];
  let activeDaySubmission: Submission | null = null;
  let loadingFriendSubmissions = false;

  let currentDate = new Date(
    new Date().setDate(
      new Date().getDate() - ($currSubNumber - $historyCurrentDay)
    )
  );

  historyCurrentDay.subscribe((day) => {
    console.log(day);
    currentDate = new Date(
      new Date().setDate(new Date().getDate() - ($currSubNumber - day))
    );
  });

  friendSubmissions.subscribe((val) => {
    if (val) sortedFriendSubmissions = [...val].sort(sortByDate);
  });

  onMount(async () => {
    if (loadingHistory) return;
    if (!$historyCurrentDay) historyCurrentDay.set(get(currSubNumber) - 1);
    loadingHistory = true;
    activeDaySubmission = await getSubmission();
    friendSubmissions.set([]);
    loadingFriendSubmissions = true;
    await loadFriendSubmissions($historyCurrentDay);
    loadingFriendSubmissions = false;
    loadingHistory = false;
  });

  onDestroy(async () => {
    friendSubmissions.set(currFriendSubmissions);
  });

  const getPreviousDay = async () => {
    loadingHistory = true;
    direction = 'left';
    historyCurrentDay.update((day) => (day -= 1));
    activeDaySubmission = await getSubmission();
    loadingFriendSubmissions = true;
    friendSubmissions.set([]);
    await loadFriendSubmissions($historyCurrentDay);
    loadingFriendSubmissions = false;
    loadingHistory = false;
  };

  const getNextDay = async () => {
    if ($historyCurrentDay + 1 === $currSubNumber) return;
    direction = 'right';
    loadingHistory = true;
    historyCurrentDay.update((day) => (day += 1));
    activeDaySubmission = await getSubmission();
    loadingFriendSubmissions = true;
    friendSubmissions.set([]);
    await loadFriendSubmissions($historyCurrentDay);
    loadingFriendSubmissions = false;
    loadingHistory = false;
  };

  const getSubmission = async () => {
    const colRes = await FirebaseFirestore.getCollection({
      reference: 'submissions',
      compositeFilter: userSubmissionFilter($historyCurrentDay),
    });
    const sub = colRes.snapshots[0];
    let result: Submission | null = null;
    if (sub?.data) {
      result = {
        ...(sub.data as Submission),
        id: sub.id,
        time: new Date(sub.data.time),
        lateTime: new Date(sub.data.lateTime),
        user: {
          id: $session.user.id,
          username: $session.user.public.username || '',
          musicPlatform:
            $session.user.public.musicPlatform || MusicPlatform.spotify,
        },
      };
    }
    console.log(result?.number);
    return result;
  };
</script>

<div
  style={`height: calc(100vh - ${64 + $insets.bottom + $insets.top}px); padding-bottom: calc(70px + ${$insets.bottom}px)`}
  class="overflow-y-scroll"
>
  <div class="px-4">
    <div
      class="flex sticky top-0 bg-gray-800 bg-opacity-70 backdrop-blur-md border-t border-b border-white z-10 pt-2 pb-2 px-2"
    >
      <button on:click={getPreviousDay} class="text-transparent">
        <svg
          class={`flex-end w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-blue-500`}
          data-slot="icon"
          fill="none"
          stroke-width="1.5"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          ></path>
        </svg>
      </button>
      <h2 class="text-xl flex-grow text-center text-gray-300">
        {getShortDate(currentDate)}
      </h2>
      <button on:click={getNextDay} class="text-transparent">
        <svg
          class={`flex-start w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 ${$historyCurrentDay + 1 === $currSubNumber ? 'text-gray-400' : 'text-blue-500'}`}
          data-slot="icon"
          fill="none"
          stroke-width="1.5"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          ></path>
        </svg>
      </button>
    </div>
    {#key activeDaySubmission}
      {#if loadingHistory}
        <div class="my-2 border-b-2 border-gray-400">
          <SkeletonSubmission type="user" />
        </div>
        <div class="my-2">
          <SkeletonSubmission />
          <SkeletonSubmission />
          <SkeletonSubmission />
        </div>
      {:else if !activeDaySubmission}
        <p
          out:fly={{ x: direction === 'left' ? 200 : -200, duration: 200 }}
          in:fly={{ x: direction === 'left' ? -200 : 200, duration: 200 }}
          class="text-center w-full mt-3"
        >
          you did not submit on this day
        </p>
      {:else}
        <div
          out:fly={{ x: direction === 'left' ? 200 : -200, duration: 200 }}
          in:fly={{ x: direction === 'left' ? -200 : 200, duration: 200 }}
        >
          <div class="my-2 px-2 pb-2 border-b-2 border-gray-400">
            <UserSubmission data={activeDaySubmission} />
          </div>
          {#if loadingFriendSubmissions}
            <div class="my-2">
              <SkeletonSubmission />
              <SkeletonSubmission />
              <SkeletonSubmission />
            </div>
          {:else}
            {#each sortedFriendSubmissions as submission}
              <div in:slide class="my-4">
                <LargeSubmission data={submission} />
              </div>
            {/each}
            {#if $friendSubmissions?.length === 0}
              <p class="mx-auto text-center mt-3">
                nobody submitted on this day
              </p>
            {/if}
          {/if}
        </div>
      {/if}
    {/key}
  </div>
</div>
