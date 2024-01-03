<script lang="ts">
  import { goto } from '../../lib';
  import type { Submission } from '../../types';
  import { activeSubmission } from '../../store';
  import SubmissionSong from './Song.svelte';
  import SubmissionTime from './Time.svelte';
  import SubmissionActions from './Actions.svelte';

  export let data: Submission;

  const showFullSubmission = () => {
    activeSubmission.set(data);
    goto('/&submission');
  };
</script>

<div
  on:keypress={showFullSubmission}
  on:click={showFullSubmission}
  class={`border-white rounded-lg mb-1 shadow-lg bg-gray-700 `}
>
  <div class="relative">
    <!-- SONG DURATION BACKGROUND -->
    {#if data.song.timestamp === 0}
      <div
        style={`
      width: ${(data.song.durationElapsed / data.song.length) * 100}%
      `}
        class="absolute rounded-l-lg left-0 right-0 h-full bg-blue-700 opacity-60 z-0"
      />
    {/if}

    <!-- SONG -->
    <div class="sticky px-2 py-2">
      <div class="flex">
        <SubmissionTime className="w-7/10 text-left truncate" {data} />
        <SubmissionActions
          className="ml-auto flex gap-2 w-3/10 flex-grow-0 flex-shrink"
          {data}
        />
      </div>
      <SubmissionSong {data} />
    </div>
  </div>
</div>
