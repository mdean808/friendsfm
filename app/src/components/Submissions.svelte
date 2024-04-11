<script lang="ts">
  import {
    userSubmission,
    insets,
    friendSubmissions,
    user,
    createSubmissionsPlaylist,
    singleSubmissionLoading,
    getSubmissionStatus,
    getFriendSubmissions,
    updateCurrentLocation,
    getNearbySubmissions,
    submissionsScroll,
  } from '../store';
  import { goto } from '../lib/util';
  import { MusicPlatform, type Submission as SubmissionType } from '../types';
  import SkeletonSubmission from '../components/submission/Skeleton.svelte';
  import LargeSubmission from './LargeSubmission.svelte';
  import UserSubmission from './submission/User.svelte';
  import type { IonRefresher } from '@ionic/core/components/ion-refresher';
  import { onDestroy, onMount } from 'svelte';
  import { Preferences } from '@capacitor/preferences';
  import type { IonContent } from '@ionic/core/components/ion-content';
  import { slide } from 'svelte/transition';

  export let loadingSubmission: boolean;
  export let loadingFriendSubmissions: boolean;
  export let sortedFriendSubmissions: SubmissionType[];
  export let loadingNewLateSubmission: boolean;

  onMount(async () => {
    const ionContent = window.document.getElementById(
      'ion-content-submissions'
    ) as IonContent;
    ionContent.scrollByPoint(0, $submissionsScroll, 0);
    const scrollElement = await ionContent.getScrollElement();
    scrollElement.addEventListener('scroll', () => {
      $submissionsScroll = scrollElement.scrollTop;
    });
    const refresher = window.document.getElementById(
      'refresher'
    ) as IonRefresher;
    refresher.addEventListener('ionRefresh', handleRefresh);
  });

  onDestroy(async () => {
    const refresher = window.document.getElementById(
      'refresher'
    ) as IonRefresher;
    refresher?.removeEventListener('ionRefresh', handleRefresh);
  });
  const sortByDate = (a: SubmissionType, b: SubmissionType) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  };

  const loadFriends = async (hideLoadingIndicator?: boolean) => {
    if (!hideLoadingIndicator) loadingFriendSubmissions = true;
    await getFriendSubmissions();
    loadingFriendSubmissions = false;
  };

  const loadNearby = async () => {
    await updateCurrentLocation();
    // grab all submissions for the world if we don't have location permissions
    if ((await Preferences.get({ key: 'location-permissions' })).value === '0')
      getNearbySubmissions(null, {
        southWest: {
          latitude: 80,
          longitude: 180,
        },
        northEast: {
          latitude: -80,
          longitude: -180,
        },
      });
    else getNearbySubmissions(20);
  };
  const handleRefresh = async () => {
    const refresher = window.document.getElementById(
      'refresher'
    ) as IonRefresher;
    getSubmissionStatus();
    loadNearby();
    await loadFriends(true);
    loadingNewLateSubmission = false;
    refresher.complete();
  };
</script>

<ion-content
  id="ion-content-submissions"
  style={`height: calc(100vh - 110px)`}
  class=""
>
  <ion-refresher id="refresher" slot="fixed">
    <ion-refresher-content />
  </ion-refresher>
  <div class="mb-3 pt-3 px-4 mx-auto overflow-hidden">
    {#if loadingSubmission}
      <SkeletonSubmission type="user" />
    {:else if $userSubmission.song}
      <UserSubmission data={$userSubmission} />
    {/if}
  </div>
  <span class="border-white border-t-2 block w-full" />
  <div
    class="mb-3 mt-1 overflow-y-scroll"
    style={`padding-bottom: calc(120px + ${$insets.bottom}px)`}
  >
    {#if $singleSubmissionLoading || loadingNewLateSubmission}
      <div class="my-2">
        <SkeletonSubmission />
      </div>
    {/if}
    {#if loadingFriendSubmissions}
      <SkeletonSubmission />
      <SkeletonSubmission />
      <SkeletonSubmission />
    {:else if !loadingFriendSubmissions}
      {#each sortedFriendSubmissions.sort(sortByDate) as submission}
        <div in:slide class="my-4">
          <LargeSubmission data={submission} />
          <!--<Submission data={submission} />-->
        </div>
      {/each}
      {#if $friendSubmissions && [...$friendSubmissions].length === 0}
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
</ion-content>
