<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    friendSubmissions,
    loading,
    generateSubmission,
    userSubmission,
    getSubmissionStatus,
    getFriendSubmissions,
    homepageLoaded,
    user,
    notificationAction,
    createSubmissionsPlaylist,
    appLoading,
    loggedIn,
    getUserFromPreferences,
  } from '../store';
  import Button from '../components/Button.svelte';
  import UserSubmission from '../components/UserSubmission.svelte';
  import Submission from '../components/Submission.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import SkeletonSubmission from '../components/SkeletonSubmission.svelte';
  import { goto } from '../lib';
  import type { SavedSong, Submission as SubmissionType } from '../types';
  import type { IonRefresher } from '@ionic/core/components/ion-refresher';
  import { Capacitor } from '@capacitor/core';
  import { FirebaseMessaging } from '@capacitor-firebase/messaging';
  import Genres from '../components/Genres.svelte';
  import { CupertinoPane } from 'cupertino-pane';

  // GLOBALS
  let loadingSubmission = false;
  let loadingFriendSubmissions = false;

  notificationAction.subscribe(async (notif) => {
    if (!notif || !notif.title) return;
    const title = notif.title;
    if (title.includes('FriendsFM') || title.includes('late submission')) {
      load();
      loadFriends();
    }
  });

  onMount(async () => {
    if (
      Capacitor.getPlatform() !== 'ios' ||
      Capacitor.getPlatform() !== 'android'
    ) {
      const refresher = document.getElementById('refresher') as IonRefresher;
      refresher.addEventListener('ionRefresh', handleRefresh);
    }

    if (Capacitor.getPlatform() != 'web') {
      FirebaseMessaging.removeAllDeliveredNotifications();
    }

    await getUserFromPreferences();
    if (
      (!userSubmission.get() || !Object.keys(userSubmission.get())?.length) &&
      loggedIn.get() &&
      !homepageLoaded.get()
    ) {
      load();
      loadFriends();
    } else {
      if (loggedIn.get() && !homepageLoaded.get()) loadFriends(true);
      loadingSubmission = false;
      loadingFriendSubmissions = false;
      appLoading.set(false);
    }
  });

  const sortByDate = (a: SubmissionType, b: SubmissionType) => {
    return (
      new Date(b.lateTime || b.time).getTime() -
      new Date(a.lateTime || a.time).getTime()
    );
  };

  onDestroy(() => {
    const refresher = document.getElementById('refresher') as IonRefresher;
    refresher?.removeEventListener('ionRefresh', handleRefresh);
  });

  const load = async () => {
    homepageLoaded.set(false);
    loadingSubmission = true;
    await getSubmissionStatus();
    loadingSubmission = false;
    if (!userSubmission.get() || !userSubmission.get().song) {
      loadingFriendSubmissions = false;
    }
    appLoading.set(false);
    homepageLoaded.set(true);
  };

  const loadFriends = async (hideLoadingIndicator?: boolean) => {
    if (!hideLoadingIndicator) loadingFriendSubmissions = true;
    await getFriendSubmissions();
    if (!hideLoadingIndicator) loadingFriendSubmissions = false;
  };

  const handleRefresh = async () => {
    const refresher = document.getElementById('refresher') as IonRefresher;
    getSubmissionStatus();
    await loadFriends(true);
    refresher.complete();
  };

  const createSubmission = async () => {
    loading.set(true);
    loadFriends(true);
    await generateSubmission();
    loading.set(false);
  };
</script>

<ion-content>
  <ion-refresher id="refresher" slot="fixed">
    <ion-refresher-content />
  </ion-refresher>
  {#if $userSubmission}
    <div id="home" class="text-center w-full py-2 px-4 overflow-y-auto h-full">
      <div class="pb-2">
        <Genres />
      </div>
      <span class="border-white border-t-2 block w-full" />
      <div class="mb-3 mt-3 px-4 mx-auto">
        {#if loadingSubmission}
          <LoadingIndicator className={'mx-auto w-16 h-16'} />
        {:else if $userSubmission.song}
          <UserSubmission data={$userSubmission} />
        {/if}
      </div>
      {#if !$userSubmission.song}
        <h3>you haven't shared what you're listening to yet.</h3>
        <h4 class="mb-2">submit to see what your friends are playing!</h4>
      {/if}
      <span class="border-white border-t-2 block w-full" />
      <div class="my-3">
        {#if loadingFriendSubmissions}
          <SkeletonSubmission />
          <SkeletonSubmission />
          <SkeletonSubmission />
        {:else if !$userSubmission.song}
          <Button
            type="primary"
            className="mb-2 bg-blue-500"
            title="Share current song."
            on:click={createSubmission}>share</Button
          >
        {:else if !loadingSubmission}
          {#each [...$friendSubmissions].sort(sortByDate) as submission}
            <div class="my-2">
              <Submission data={submission} />
            </div>
          {/each}
          {#if $friendSubmissions.length === 0}
            <p class="mx-auto text-center mt-3">
              nobody else has submitted yet.
            </p>
            <p
              on:keyup={() => goto('/friends')}
              on:click={() => goto('/friends')}
              class="mx-auto text-center text-blue-500 underline"
            >
              add friends.
            </p>
          {/if}
          {#if $user.submissionsPlaylist}
            <a
              href={`https://open.spotify.com/playlist/${$user.submissionsPlaylist}`}
              class="mx-auto text-center mt-3 text-gray-300 underline"
            >
              open your submissions playlist
            </a>
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
    </div>
  {:else}
    <div id="home" class="text-center w-full py-2 px-4 overflow-y-auto h-full">
      <div class="mb-3 px-5 mx-auto">
        <LoadingIndicator className={'mx-auto w-16 h-16'} />
      </div>
      <span class="border-white border-t-2 block w-full" />
      <div class="my-2">
        <SkeletonSubmission />
        <SkeletonSubmission />
        <SkeletonSubmission />
      </div>
    </div>
  {/if}
</ion-content>
