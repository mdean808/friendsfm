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
    user,
    createSubmissionsPlaylist,
    getNearbySubmissions,
    getUserStatistics,
    header,
    insets,
  } from '../store';
  import Button from '../components/Button.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import SkeletonSubmission from '../components/submission/Skeleton.svelte';
  import Submission from '../components/submission/index.svelte';
  import UserSubmission from '../components/submission/User.svelte';
  import type { IonRefresher } from '@ionic/core/components/ion-refresher';
  import { Capacitor } from '@capacitor/core';
  import { FirebaseMessaging } from '@capacitor-firebase/messaging';
  import type { Submission as SubmissionType } from '../types';
  import { goto } from '../lib';
  import Genres from '../components/Genres.svelte';

  // GLOBALS
  let loadingSubmission = false;
  let loadingFriendSubmissions = false;
  let sortedFriendSubmissions: SubmissionType[] = [];
  let loadingGenres = false;
  // let previousDays: (HomeDayType | 'loading' | 'end')[] = [
  //   'loading',
  //   'loading',
  // ];
  // let currentIndex = -1;

  // function renderSwiper(container: SwiperContainer, _bar: any) {
  //   // the node has been mounted in the DOM
  //   container.initialize();
  //   container.swiper.slideTo(previousDays.length);
  //   container.swiper.on('slideChange', async (a) => {
  //     if (a.swipeDirection === 'prev') {
  //       currentIndex++;
  //     } else {
  //       currentIndex--;
  //     }
  //     if (currentIndex === -1) return;
  //     const res = await fetch(getFirebaseUrl('getsubmissionbynumber'), {
  //       method: 'POST',
  //       body: JSON.stringify({
  //         authToken: $authToken,
  //         number: $userSubmission.number - (currentIndex + 1),
  //       }),
  //     });
  //     const json = await handleApiResponse(res);
  //     if (!json) return; // error
  //     const data = json.message as HomeDayType;
  //     previousDays[currentIndex] = data;
  //     if (
  //       $userSubmission.number !==
  //         $userSubmission.number - (currentIndex + 1) &&
  //       data.userSubmission.song
  //     )
  //       navDate.set(new Date(data.userSubmission.time));
  //     else if (!data.userSubmission.song) navDate.set(null);
  //     else navDate.set(new Date());
  //   });
  //   return {
  //     update(bar: string) {
  //       console.log(bar);
  //       // the value of `bar` has changed
  //     },
  //
  //     destroy() {
  //       // the node has been removed from the DOM
  //     },
  //   };
  // }

  notificationAction.subscribe(async (notif) => {
    if (!notif || !notif.data) return;
    const data: { [key: string]: any } = notif.data;
    switch (data.type) {
      case 'daily':
        load();
        break;
      case 'late-submission':
        loadFriends();
        break;
      default:
        break;
    }
  });

  friendSubmissions.listen((val) => {
    if (val) sortedFriendSubmissions = [...val].sort(sortByDate);
  });

  // from siper/element/bundle
  // register();

  onMount(async () => {
    header.set('');
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
    if (loggedIn.get()) getUserStatistics();
    if (
      (!userSubmission.get() || !Object.keys(userSubmission.get())?.length) &&
      loggedIn.get() &&
      !homepageLoaded.get()
    ) {
      load();
      loadFriends();
      loadGenres();
    } else {
      if (loggedIn.get() && !homepageLoaded.get()) loadFriends(true);
      loadingGenres = false;
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
      loadingGenres = false;
    }
    appLoading.set(false);
    homepageLoaded.set(true);
  };

  const loadFriends = async (hideLoadingIndicator?: boolean) => {
    if (!hideLoadingIndicator) loadingFriendSubmissions = true;
    await getFriendSubmissions();
    if (!hideLoadingIndicator) loadingFriendSubmissions = false;
  };

  const loadGenres = async () => {
    loadingGenres = true;
    await getNearbySubmissions();
    loadingGenres = false;
  };

  const handleRefresh = async () => {
    const refresher = document.getElementById('refresher') as IonRefresher;
    getSubmissionStatus();
    loadGenres();
    await loadFriends(true);
    refresher.complete();
  };

  const createSubmission = async () => {
    loading.set(true);
    await generateSubmission();
    loadFriends();
    loadGenres();
    loading.set(false);
  };
  const sortByDate = (a: SubmissionType, b: SubmissionType) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
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
          <!-- <swiper-container -->
          <!--   use:renderSwiper={'home-swiper'} -->
          <!--   init={false} -->
          <!--   id={'home-swiper'} -->
          <!--   class="h-full" -->
          <!--   pagination={true} -->
          <!--   pagination-dynamic-bullets={true} -->
          <!-- > -->
          <!-- {#each [...previousDays].reverse() as day} -->
          <!--   <swiper-slide> -->
          <!--     {#if day === 'loading'} -->
          <!--       loading -->
          <!--     {:else if day === 'end'} -->
          <!--       <p>you've reached the end of the line.</p> -->
          <!--       <p>there are no more submissions to be viewed.</p> -->
          <!--     {:else} -->
          <!--       <HomeDay data={day} /> -->
          <!--     {/if} -->
          <!--   </swiper-slide> -->
          <!-- {/each} -->
          <!-- <swiper-slide> -->
          {#if $userSubmission}
            <div id="home" class="text-center w-full overflow-y-auto h-full">
              {#if $userSubmission.song}
                <div class="pb-2">
                  <Genres loading={loadingGenres} />
                </div>
              {/if}
              <span class="border-white border-t-2 block w-full" />
              <div class="mb-3 mt-3 px-4 mx-auto">
                {#if loadingSubmission}
                  <LoadingIndicator className={'mx-auto w-16 h-16'} />
                {:else if $userSubmission.song}
                  <UserSubmission data={$userSubmission} />
                {/if}
              </div>
              <span class="border-white border-t-2 block w-full" />
              <div
                class="my-3"
                style={`padding-bottom: calc(70px + ${$insets.bottom}px)`}
              >
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
          {/if}
          <!-- </swiper-slide> -->
          <!-- </swiper-container> -->
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
