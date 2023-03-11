<script lang="ts">
  // IMPORTS
  import { onMount, onDestroy } from 'svelte';
  import { SplashScreen } from '@capacitor/splash-screen';
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
  import Button from '../components/Button.svelte';
  import Submission from '../components/Submission.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import SkeletonSubmission from '../components/SkeletonSubmission.svelte';
  import {
    convertDateToLateString,
    formatDurationPlayed,
    formatTimePlayed,
    goto,
  } from '../lib';
  import type { SavedSong, Submission as SubmissionType } from '../types';
  import type { IonRefresher } from '@ionic/core/components/ion-refresher';

  // GLOBALS
  let loadingSubmissions = true;
  let sortedSubmissions: SubmissionType[] = [];

  friendSubmissions.subscribe((val) => {
    sortedSubmissions = [...val].sort(
      (a, b) =>
        new Date(b.lateTime || b.time).getTime() -
        new Date(a.lateTime || a.time).getTime()
    );
  });

  onMount(async () => {
    const refresher = document.getElementById('refresher') as IonRefresher;
    // refresher.addEventListener('ionRefresh', () => {
    //   console.log('refreshing');
    // });
    refresher.addEventListener('ionRefresh', handleRefresh);
    // setup pull to refresh
    if (!authToken.get()) {
      authToken.listen(async (value) => {
        if (value && currPath.get() == '/') {
          loadingSubmissions = true;
          await getSubmissionStatus();
          loadingSubmissions = false;
          // Hide splash screen
          await SplashScreen.hide();
        }
      });
    } else if (!userSubmission.get()?.song) {
      loadingSubmissions = true;
      await getSubmissionStatus();
    }
    // Hide splash screen
    await SplashScreen.hide();
    loadingSubmissions = false;
  });

  onDestroy(() => {
    const refresher = document.getElementById('refresher') as IonRefresher;
    refresher?.removeEventListener('ionRefresh', handleRefresh);
  });

  const handleRefresh = async () => {
    const refresher = document.getElementById('refresher') as IonRefresher;
    await getSubmissionStatus();
    refresher.complete();
  };

  const createSubmission = async () => {
    loading.set(true);
    await generateSubmission();
    loading.set(false);
  };

  let loadingHeart = false;
  const toggleHeart = async () => {
    if (loadingHeart) return;
    loadingHeart = true;
    const savedSong: SavedSong = {
      ...$userSubmission.song,
      user: {
        id: $user.id,
        username: $user.username,
      },
    };
    await toggleSong(savedSong);
    loadingHeart = false;
  };
</script>

<ion-content>
  <ion-refresher id="refresher" slot="fixed">
    <ion-refresher-content />
  </ion-refresher>
  <div id="home" class="text-center w-full py-2 px-4 overflow-y-auto h-full">
    <div class="mb-3 w-3/4 mx-auto">
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
          <span class="text-sm text-red-500">
            {convertDateToLateString(new Date($userSubmission.lateTime))}
          </span>
        {/if}
        <div
          class="border-2 w-full border-gray-600 rounded-md mx-auto my-1 py-2 text-left space-x-4 flex px-2"
        >
          <a href={$userSubmission.song.url} class="flex-grow">
            <div class="flex-col flex h-full">
              <p class={`flex-grow text-${$user.musicPlatform}`}>
                {$userSubmission.song.name}
              </p>
              <p class="">{$userSubmission.song.artist}</p>
            </div>
          </a>
          <div class="flex-grow-0 text-right">
            <div class="h-full flex flex-col flex-nowrap justify-between">
              <svg
                on:click={toggleHeart}
                on:keypress={toggleHeart}
                class={`w-6 h-6 ml-auto flex-grow-0 flex-shrink ${
                  loadingHeart ? 'animate-ping text-pink-500' : ''
                } ${
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
              <div class="flex-grow-0 flex-shrink" />
            </div>
          </div>
        </div>
        {#if $userSubmission.audial && $userSubmission.audial.number != -1}
          <div class="text-sm">
            <p>audial #{$userSubmission.audial.number}</p>
            {$userSubmission.audial.score}
          </div>
        {:else}
          <button
            class="text-blue-500 text-sm underline"
            on:click={() => goto('/paste_audial')}>share audial score</button
          >
        {/if}
        <p class="text-gray-400 ">
          {#if $userSubmission.song.timestamp > 0}
            song played at {formatTimePlayed($userSubmission.song.timestamp)}
          {:else}
            <div class="flex items-center my-2">
              <span class="h-5"
                >{formatDurationPlayed(
                  $userSubmission.song.durationElapsed
                )}</span
              >
              <div
                class="w-full mx-2 my-auto ray-200 rounded-full h-1 bg-gray-600"
              >
                <div
                  class="bg-blue-500 h-1 rounded-full"
                  style={`width: ${
                    ($userSubmission.song.durationElapsed /
                      $userSubmission.song.length) *
                    100
                  }%`}
                />
              </div>
              <span class="h-5"
                >{formatDurationPlayed($userSubmission.song.length)}</span
              >
            </div>
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
        {#each sortedSubmissions as submission}
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
</ion-content>
