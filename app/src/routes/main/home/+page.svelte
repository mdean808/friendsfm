<script lang="ts">
  import SkeletonSubmission from '$components/submission/Skeleton.svelte';
  import Genres from '$components/Genres.svelte';
  import Submissions from '$components/Submissions.svelte';
  import Tabs from '$components/Tabs.svelte';
  import { activeHomeTab, submissionLoaded } from '$lib/util';
  import { userSubmission } from '$lib/submission';
  import { onMount } from 'svelte';
  import SubmissionPreview from '$components/SubmissionPreview.svelte';

  onMount(() => {
    activeHomeTab.set('submissions');
  });
</script>

{#if $userSubmission}
  <div id="home" class={`text-center w-full h-auto px-4 overflow-y-scroll`}>
    <div class="h-full">
      {#if $userSubmission && Submissions && Genres}
        <div class="text-center w-full h-full">
          <div>
            <Tabs
              loading={false}
              activeTab={activeHomeTab}
              tabs={[
                {
                  name: 'submissions',
                  id: 'submissions',
                  component: Submissions,
                },
                { name: 'nearby', id: 'genres', component: Genres },
              ]}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
{:else if $submissionLoaded && !userSubmission}
  <div id="home" class={`text-center w-full h-auto px-4 overflow-y-scroll`}>
    <div class="h-full">
      <SubmissionPreview />
    </div>
  </div>
{:else}
  <div id="home" class="text-center w-full px-4 overflow-y-auto h-auto">
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
