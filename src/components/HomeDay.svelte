<script lang="ts">
  import UserSubmission from '../components/UserSubmission.svelte';
  import Submission from '../components/Submission.svelte';
  import type { Submission as SubmissionType, HomeDay } from '../types';
  import Genres from '../components/Genres.svelte';

  // GLOBALS
  export let data: HomeDay;

  const sortByDate = (a: SubmissionType, b: SubmissionType) => {
    return (
      new Date(b.lateTime || b.time).getTime() -
      new Date(a.lateTime || a.time).getTime()
    );
  };
</script>

{#if data.userSubmission && data.userSubmission.song}
  <div id="home" class="text-center w-full overflow-y-auto h-full">
    <div class="pb-2">
      <Genres />
    </div>
    <span class="border-white border-t-2 block w-full" />
    <div class="mb-3 mt-3 px-4 mx-auto">
      {#if data.userSubmission.song}
        <UserSubmission data={data.userSubmission} />
      {/if}
    </div>
    <span class="border-white border-t-2 block w-full" />
    <div class="my-3">
      {#each [...data.friendSubmissions].sort(sortByDate) as submission}
        <div class="my-2">
          <Submission data={submission} />
        </div>
      {/each}
      {#if data.friendSubmissions.length === 0}
        <p class="mx-auto text-center mt-3">
          nobody else submitted on this day
        </p>
      {/if}
    </div>
  </div>
{:else}
  <div id="home" class="text-center w-full py-2 px-4 overflow-y-auto h-full">
    <div class="mb-3 px-5 mx-auto">
      <p class="mx-auto text-center mt-3">you did not submit on this day</p>
    </div>
  </div>
{/if}
