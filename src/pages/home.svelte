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
    getNearbySubmissions,
    getUserStatistics,
    header,
    loginState,
    logout,
    activeHomeTab,
  } from '../store';
  import Button from '../components/Button.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import SkeletonSubmission from '../components/submission/Skeleton.svelte';
  import type { IonRefresher } from '@ionic/core/components/ion-refresher';
  import { Capacitor } from '@capacitor/core';
  import { FirebaseMessaging } from '@capacitor-firebase/messaging';
  import { UserState, type Submission as SubmissionType } from '../types';
  import GenreTagline from '../components/GenreTagline.svelte';
  import Genres from '../components/Genres.svelte';
  import Submissions from '../components/Submissions.svelte';
  import Tabs from '../components/Tabs.svelte';

  // GLOBALS
  let loadingSubmission = false;
  let loadingFriendSubmissions = false;
  let sortedFriendSubmissions: SubmissionType[] = [];
  let loadingGenres = false;

  notificationAction.subscribe(async (notif) => {
    if (!notif || !notif.data) return;
    const data: { [key: string]: any } = notif.data;
    switch (data.type) {
      case 'daily':
        if ($loginState === UserState.registered) load();
        break;
      case 'late-submission':
        if ($loginState === UserState.registered) loadFriends();
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

    if ($loginState !== UserState.registered) return logout();
    getUserStatistics();
    if (
      (!userSubmission.get() || !Object.keys(userSubmission.get())?.length) &&
      !homepageLoaded.get()
    ) {
      load();
      loadFriends();
      loadGenres();
    } else {
      if (!homepageLoaded.get()) loadFriends(true);
      loadingGenres = false;
      loadingSubmission = false;
      loadingFriendSubmissions = false;
      appLoading.set(false);
    }
    if ($friendSubmissions)
      sortedFriendSubmissions = [...$friendSubmissions].sort(sortByDate);
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
    //todo: make bounding box
    await getNearbySubmissions(20);
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
    <div id="home" class="text-center w-full py-1 px-4">
      {#if !$userSubmission.song && !loadingSubmission}
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
          {#if $userSubmission}
            <div id="home" class="text-center w-full overflow-y-auto h-full">
              {#if $userSubmission.song}
                <div class="pb-2">
                  <GenreTagline loading={loadingGenres} />
                </div>
              {/if}
              <span class="border-white border-t-2 block w-full" />
              <div>
                <Tabs
                  activeTab={activeHomeTab}
                  tabs={[
                    {
                      name: 'submissions',
                      id: 'submissions',
                      component: Submissions,
                      props: {
                        loadingSubmission,
                        loadingFriendSubmissions,
                        sortedFriendSubmissions,
                      },
                    },
                    { name: 'genres', id: 'genres', component: Genres },
                  ]}
                />
              </div>
            </div>
          {/if}
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
