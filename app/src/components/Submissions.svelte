<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import type { IonRefresher } from '@ionic/core/components/ion-refresher';
  import type { IonContent } from '@ionic/core/components/ion-content';
  import SkeletonSubmission from '$components/submission/Skeleton.svelte';
  import LargeSubmission from './LargeSubmission.svelte';
  import UserSubmission from './submission/User.svelte';
  import { MusicPlatform, type Submission } from '$lib/types';
  import { submissionsScroll } from '$lib/util';
  import {
    createSubmissionsPlaylist,
    loadFriendSubmissions,
    loadUserSubmission,
    userSubmission,
  } from '$lib/submission';
  import { friendSubmissions } from '$lib/submission';
  import { insets } from '$lib/device';
  import { session } from '$lib/session';
  import { goto } from '$app/navigation';

  let loadingSubmission: boolean = false;
  let loadingFriendSubmissions: boolean = false;
  let loadingNewLateSubmission: boolean = false;
  let sortedFriendSubmissions: Submission[];

  const sortByDate = (a: Submission, b: Submission) => {
    try {
      return b.time.toDate().getTime() - a.time.toDate().getTime();
    } catch {
      return 1;
    }
  };

  friendSubmissions.subscribe((val) => {
    if (val) sortedFriendSubmissions = [...val].sort(sortByDate);
    if (val?.length > 0) loadingFriendSubmissions = false;
  });

  onMount(async () => {
    const ionContent = window.document.getElementById(
      'ion-content-submissions'
    ) as IonContent;
    ionContent.scrollByPoint(0, $submissionsScroll, 0);
    const scrollElement = await ionContent.getScrollElement();
    scrollElement?.addEventListener('scroll', () => {
      $submissionsScroll = scrollElement.scrollTop;
    });
    const refresher = window.document.getElementById(
      'refresher'
    ) as IonRefresher;
    refresher?.addEventListener('ionRefresh', handleRefresh);
  });

  onDestroy(async () => {
    const refresher = window.document.getElementById(
      'refresher'
    ) as IonRefresher;
    refresher?.removeEventListener('ionRefresh', handleRefresh);
  });

  const handleRefresh = async () => {
    const refresher = window.document.getElementById(
      'refresher'
    ) as IonRefresher;
    loadUserSubmission();
    await loadFriendSubmissions();
    refresher.complete();
  };
</script>

<ion-content id="ion-content-submissions" style={`height: calc(100vh - 110px)`}>
  <ion-refresher id="refresher" slot="fixed">
    <ion-refresher-content />
  </ion-refresher>
  <div class="mb-3 pt-3 px-4 mx-auto overflow-hidden">
    {#if loadingSubmission}
      <SkeletonSubmission type="user" />
    {:else if $userSubmission?.song}
      <UserSubmission data={$userSubmission} />
    {/if}
  </div>
  <span class="border-white border-t-2 block w-full" />
  <div
    class="mb-3 mt-1 overflow-y-scroll"
    style={`padding-bottom: calc(80px + ${$insets.bottom + $insets.top}px)`}
  >
    {#if loadingNewLateSubmission}
      <div class="my-2">
        <SkeletonSubmission />
      </div>
    {/if}
    {#if loadingFriendSubmissions}
      <SkeletonSubmission />
      <SkeletonSubmission />
      <SkeletonSubmission />
    {:else if !loadingFriendSubmissions}
      {#each sortedFriendSubmissions as submission}
        <div in:slide class="my-4">
          <LargeSubmission data={submission} />
          <!--<Submission data={submission} />-->
        </div>
      {/each}
      {#if $friendSubmissions?.length === 0}
        <p class="mx-auto text-center mt-3">nobody else has submitted yet.</p>
        <div
          on:keyup={() => goto('/friends')}
          on:click={() => goto('/friends')}
          role="button"
          tabindex="0"
        >
          <p class="mx-auto text-center text-blue-500 underline">
            add friends.
          </p>
        </div>
      {/if}
      {#if $session.user.submissionsPlaylist}
        {#if $session.user.public.musicPlatform === MusicPlatform.spotify}
          <a
            href={`https://open.spotify.com/playlist/${$session.user.submissionsPlaylist}`}
            class="mx-auto text-center mt-3 text-gray-300 underline"
          >
            open your submissions playlist
          </a>
        {:else if $session.user.public.musicPlatform === MusicPlatform.appleMusic}
          <a
            href={$session.user.submissionsPlaylist}
            class="mx-auto text-center mt-3 text-gray-300 underline"
          >
            open your submissions playlist
          </a>
        {/if}
      {:else}
        <div
          on:keyup={createSubmissionsPlaylist}
          on:click={createSubmissionsPlaylist}
          role="button"
          tabindex="0"
        >
          <p
            class="mx-auto text-center mt-3 text-gray-300 opacity-70 underline"
          >
            create your dynamic friendsfm playlist.
          </p>
        </div>
      {/if}
    {/if}
  </div>
</ion-content>
