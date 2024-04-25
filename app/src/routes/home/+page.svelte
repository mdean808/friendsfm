<script lang="ts">
  import { onMount } from 'svelte';
  import SkeletonSubmission from '$components/submission/Skeleton.svelte';
  import { type Submission as SubmissionType } from '$lib/types';
  import Genres from '$components/Genres.svelte';
  import Submissions from '$components/Submissions.svelte';
  import Tabs from '$components/Tabs.svelte';
  import { activeHomeTab } from '$lib/util';
  import { userSubmission, friendSubmissions } from '$lib/submission';

  // GLOBALS
  let sortedFriendSubmissions: SubmissionType[] = [];
  // NOTE: might not need these
  let loadingNewLateSubmission = false;
  let loadingFriendSubmissions = false;

  friendSubmissions.subscribe((val) => {
    if (val) sortedFriendSubmissions = [...val].sort(sortByDate);
    if (val?.length > 0) loadingFriendSubmissions = false;
  });

  onMount(async () => {});

  const sortByDate = (a: SubmissionType, b: SubmissionType) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  };
</script>

{#if $userSubmission}
  <div
    id="home"
    class={`text-center w-full h-full py-1 px-4 overflow-y-scroll`}
  >
    <div class="h-full">
      {#if $userSubmission && Submissions && Genres}
        <div id="home" class="text-center w-full h-full">
          <div>
            <Tabs
              loading={false}
              activeTab={activeHomeTab}
              tabs={[
                {
                  name: 'submissions',
                  id: 'submissions',
                  component: Submissions,
                  props: {
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
