<script lang="ts">
  import { getPlatformColor } from '../lib';
  import MusicPlatformIcon from './MusicPlatformIcon.svelte';
  import type { Submission } from '../types';

  export let data: Submission;

  const formatDurationPlayed = (duration: number) => {
    const d = new Date(Date.UTC(0, 0, 0, 0, 0, 0, duration * 1000)),
      // Pull out parts of interest
      parts = [d.getUTCMinutes(), d.getUTCSeconds()];
    // Zero-pad
    return parts.map((s) => String(s).padStart(2, '0')).join(':');
  };
</script>

<main class="border-2 border-gray-600 rounded-md py-2 px-4 flex">
  <div class="flex-grow text-left">
    <h4 class="text-xl mb-2">
      {data.user ? data.user.username : 'Unknown'}
      <span class={`text-${getPlatformColor(data.user.musicPlatform)}`}
        ><MusicPlatformIcon
          className="inline w-5 h-5"
          id={data.user ? data.user.musicPlatform : 'spotify'}
        />
      </span>
      {#if !data.late}
        <span class="text-sm text-gray-400"
          >{new Date(data.time).toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          })}
        </span>
      {:else}
        <span class="text-sm text-red-500"
          >{new Date(data.time).toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          })}
        </span>
      {/if}
    </h4>
    <a href={data.song.url}>
      <p class={`text-${getPlatformColor(data.user.musicPlatform)}`}>
        {data.song.name}
      </p>
      <p>{data.song.artist}</p>
      <p class="text-gray-400">
        {formatDurationPlayed(data.song.durationElapsed)} played
      </p>
    </a>
  </div>
  <div class="flex-grow-0 text-right">
    <div class="h-full flex flex-col flex-nowrap justify-between">
      <svg
        class="w-6 h-6 ml-auto flex-grow-0 flex-shrink "
        fill="none"
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
      <div class="flex-grow-0 flex-shrink">
        {#if data.audial}
          <p>#{data.audial.number}</p>
          {data.audial.score}
        {/if}
      </div>
    </div>
  </div>
</main>
