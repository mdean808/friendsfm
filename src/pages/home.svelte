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
    notificationAction,
    appLoading,
    loggedIn,
    getUserFromPreferences,
    authToken,
    user,
    createSubmissionsPlaylist,
    navDate,
  } from '../store';
  import Button from '../components/Button.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import SkeletonSubmission from '../components/SkeletonSubmission.svelte';
  import Submission from '../components/Submission.svelte';
  import UserSubmission from '../components/UserSubmission.svelte';
  import type { IonRefresher } from '@ionic/core/components/ion-refresher';
  import { Capacitor } from '@capacitor/core';
  import { FirebaseMessaging } from '@capacitor-firebase/messaging';
  import { register, type SwiperContainer } from 'swiper/element/bundle';
  import HomeDay from '../components/HomeDay.svelte';
  import type {
    HomeDay as HomeDayType,
    Submission as SubmissionType,
  } from '../types';
  import { getFirebaseUrl, goto, handleApiResponse } from '../lib';
  import Genres from '../components/Genres.svelte';

  // GLOBALS
  let loadingSubmission = false;
  let loadingFriendSubmissions = false;
  let previousDays: (HomeDayType | 'loading' | 'end')[] = [
    'loading',
    'loading',
  ];
  let currentIndex = -1;

  function renderSwiper(container: SwiperContainer, _bar: any) {
    // the node has been mounted in the DOM
    container.initialize();
    container.swiper.slideTo(previousDays.length);
    container.swiper.on('slideChange', async (a) => {
      if (a.swipeDirection === 'prev') {
        currentIndex++;
      } else {
        currentIndex--;
      }
      if (currentIndex === -1) return;
      const res = await fetch(getFirebaseUrl('getsubmissionbynumber'), {
        method: 'POST',
        body: JSON.stringify({
          authToken: $authToken,
          number: $userSubmission.number - (currentIndex + 1),
        }),
      });
      const json = await handleApiResponse(res);
      if (!json) return; // error
      const data = json.message as HomeDayType;
      previousDays[currentIndex] = data;
      if (
        $userSubmission.number !==
          $userSubmission.number - (currentIndex + 1) &&
        data.userSubmission.song
      )
        navDate.set(new Date(data.userSubmission.time));
      else if (!data.userSubmission.song) navDate.set(null);
      else navDate.set(new Date());
    });
    return {
      update(bar: string) {
        console.log(bar);
        // the value of `bar` has changed
      },

      destroy() {
        // the node has been removed from the DOM
      },
    };
  }

  notificationAction.subscribe(async (notif) => {
    if (!notif || !notif.title) return;
    const title = notif.title;
    if (title.includes('FriendsFM') || title.includes('late submission')) {
      load();
      loadFriends();
    }
  });

  register();

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
  const sortByDate = (a: SubmissionType, b: SubmissionType) => {
    return (
      new Date(b.lateTime || b.time).getTime() -
      new Date(a.lateTime || a.time).getTime()
    );
  };
</script>

<ion-content>
  <ion-refresher id="refresher" slot="fixed">
    <ion-refresher-content />
  </ion-refresher>
  {#if $userSubmission}
    <div id="home" class="text-center w-full py-2 px-4 overflow-y-auto h-full">
      {#if !$userSubmission.song}
        <h3>you haven't shared what you're listening to yet.</h3>
        <h4 class="mb-2">submit to see what your friends are playing!</h4>
        <span class="border-white border-t-2 block w-full" />
        <Button
          type="primary"
          className="my-2 bg-blue-500"
          title="Share current song."
          on:click={createSubmission}>share</Button
        >
      {:else}
        <div class="h-full">
          <swiper-container
            use:renderSwiper={'home-swiper'}
            init={false}
            id={'home-swiper'}
            class="h-full"
            pagination={true}
            pagination-dynamic-bullets={true}
          >
            {#each [...previousDays].reverse() as day}
              <swiper-slide>
                {#if day === 'loading'}
                  loading
                {:else if day === 'end'}
                  <p>you've reached the end of the line.</p>
                  <p>there are no more submissions to be viewed.</p>
                {:else}
                  <HomeDay data={day} />
                {/if}
              </swiper-slide>
            {/each}
            <swiper-slide>
              {#if $userSubmission}
                <div
                  id="home"
                  class="text-center w-full overflow-y-auto h-full"
                >
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
                  <span class="border-white border-t-2 block w-full" />
                  <div class="my-3">
                    {#if loadingFriendSubmissions}
                      <SkeletonSubmission />
                      <SkeletonSubmission />
                      <SkeletonSubmission />
                    {:else if !loadingFriendSubmissions}
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
                    {/if}
                  </div>
                </div>
              {/if}
            </swiper-slide>
          </swiper-container>
        </div>
      {/if}
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
