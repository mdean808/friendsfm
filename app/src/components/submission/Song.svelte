<script lang="ts">
  import type { Submission } from '../../types';
  import MusicPlatformIcon from '../icons/MusicPlatformIcon.svelte';

  export let data: Submission;
</script>

<div class="flex">
  <div class="w-10/12 text-left">
    <div class="flex mb-1 mt-0.5">
      {#if data.song.albumArtwork}
        <img
          alt="Album Artwork"
          class="w-1/4 mr-2 max-w-[3rem] max-h-[3rem]"
          src={data.song.albumArtwork}
        />
      {/if}
      <div class="w-3/4 flex flex-col items-end pr-3 justify-end">
        <span class={`w-full truncate text-${data.user.musicPlatform}`}>
          {data.song.name}
        </span>
        <span class="w-full truncate text-gray-100">
          {data.song.artist}
        </span>
      </div>
    </div>
  </div>
  <div class="w-2/12 text-right mb-1 flex">
    <MusicPlatformIcon
      id={data.user ? data.user.musicPlatform : 'spotify'}
      className="h-5 w-5 self-end ml-auto"
    />
  </div>
</div>
