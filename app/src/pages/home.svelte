<script lang="ts">
  import { onMount } from 'svelte';
  import {
    friendSubmissions,
    loading,
    generateSubmission,
    userSubmission,
    getSubmissionStatus,
    getFriendSubmissions,
    loadingSubmission,
    homepageLoaded,
    appLoading,
    getNearbySubmissions,
    getUserStatistics,
    header,
    loginState,
    logout,
    activeHomeTab,
    platform,
    notificationAction,
    updateCurrentLocation,
  } from '../store';

  import SkeletonSubmission from '../components/submission/Skeleton.svelte';
  import { FirebaseMessaging } from '@capacitor-firebase/messaging';
  import { UserState, type Submission as SubmissionType } from '../types';
  import Genres from '../components/Genres.svelte';
  import Submissions from '../components/Submissions.svelte';
  import SubmissionPreview from '../components/SubmissionPreview.svelte';
  import Tabs from '../components/Tabs.svelte';
  import { App } from '@capacitor/app';
  import { Preferences } from '@capacitor/preferences';

  // GLOBALS
  let loadingFriendSubmissions = false;
  let sortedFriendSubmissions: SubmissionType[] = [];
  let loadingGenres = false;
  let loadingNewLateSubmission = false;

  friendSubmissions.listen((val) => {
    if (val) sortedFriendSubmissions = [...val].sort(sortByDate);
    if (val?.length > 0) loadingFriendSubmissions = false;
  });

  onMount(async () => {
    header.set('');

    if ($platform != 'web') {
      FirebaseMessaging.removeAllDeliveredNotifications();
    }

    if ($loginState !== UserState.registered) return logout();
    getUserStatistics();
    // check previous notification for notification-based state
    const notifData = $notificationAction.data as { [key: string]: any };
    if (notifData && notifData.type === 'late-submission') {
      (async () => {
        loadingNewLateSubmission = true;
        await loadFriends(true);
        loadingNewLateSubmission = false;
      })();
    }
    if (
      (!userSubmission.get() || !Object.keys(userSubmission.get())?.length) &&
      !homepageLoaded.get()
    ) {
      load();
      loadFriends();
      loadNearby();
    } else {
      if (!homepageLoaded.get()) {
        loadFriends(true);
      }
      loadNearby();
      loadingGenres = false;
      $loadingSubmission = false;
      loadingFriendSubmissions = false;
      appLoading.set(false);
      setTimeout(() => {
        appLoading.set(false);
      }, 1000);
    }
    if ($friendSubmissions) {
      sortedFriendSubmissions = [...$friendSubmissions].sort(sortByDate);
    }

    App.addListener('resume', () => {
      if (!loadingGenres && !loadingFriendSubmissions && !$loadingSubmission) {
        load(true);
        loadFriends(true);
        loadNearby();
      }
    });
  });

  const load = async (shouldHideLoader?: boolean) => {
    homepageLoaded.set(false);
    if (!shouldHideLoader) $loadingSubmission = true;
    await getSubmissionStatus();
    $loadingSubmission = false;
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
    loadingFriendSubmissions = false;
  };

  const loadNearby = async () => {
    loadingGenres = true;
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
      }).then(() => (loadingGenres = false));
    else getNearbySubmissions(20).then(() => (loadingGenres = false));
  };

  export const createSubmission = async () => {
    loading.set(true);
    await generateSubmission();
    loadFriends();
    loadNearby();
    loading.set(false);
  };

  const sortByDate = (a: SubmissionType, b: SubmissionType) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  };
</script>

{#if $userSubmission}
  <div
    id="home"
    class={`text-center w-full h-full overflow-y-scroll py-1 px-4`}
  >
    {#if !$userSubmission?.song && !$loadingSubmission}
      <SubmissionPreview />
    {:else}
      <div class="h-full">
        {#if $userSubmission && Submissions && Genres}
          <div id="home" class="text-center w-full overflow-y-auto h-full">
            <div>
              <Tabs
                loading={$loadingSubmission && loadingGenres}
                activeTab={activeHomeTab}
                tabs={[
                  {
                    name: 'submissions',
                    id: 'submissions',
                    component: Submissions,
                    props: {
                      loadingSubmission: $loadingSubmission,
                      loadingFriendSubmissions,
                      sortedFriendSubmissions,
                      loadingNewLateSubmission,
                    },
                  },
                  { name: 'nearby', id: 'genres', component: Genres },
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
      <SkeletonSubmission type="user" />
    </div>
    <span class="border-white border-t-2 block w-full" />
    <div class="my-2">
      <SkeletonSubmission />
      <SkeletonSubmission />
      <SkeletonSubmission />
    </div>
  </div>
{/if}
