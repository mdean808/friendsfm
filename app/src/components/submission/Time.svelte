<script lang="ts">
  import {
    convertDateToLateString,
    formatTimePlayed,
    getDaysAgo,
  } from '$lib/dates';
  import type { Submission } from '$lib/types/friendsfm';

  export let data: Submission;
  export let className: string = '';
  export let split = false;
</script>

<div class={className}>
  {#if !data.late}
    <span class="text-sm text-gray-400"
      >{data.time?.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })}
    </span>
  {:else}
    <span class="text-sm text-red-500">
      {convertDateToLateString(data.lateTime)}
    </span>
  {/if}
  {#if data.song?.timestamp > 0}
    {#if split}
      <p class="text-gray-400 text-sm">
        played {getDaysAgo(new Date(data.song?.timestamp))}
        {#if !getDaysAgo(new Date(data.song?.timestamp)).includes('days ago')}at
          {formatTimePlayed(data.song?.timestamp)}
        {/if}
      </p>
    {:else}
      -
      <span class="text-gray-400 text-sm">
        played {getDaysAgo(new Date(data.song?.timestamp))}
        {#if !getDaysAgo(new Date(data.song?.timestamp)).includes('days ago')}at
          {formatTimePlayed(data.song?.timestamp)}
        {/if}
      </span>
    {/if}
  {/if}
</div>
