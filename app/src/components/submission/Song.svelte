<script lang="ts">
  import { user } from '../../store';
  import type { Submission } from '../../types';
  import MusicPlatformIcon from '../icons/MusicPlatformIcon.svelte';

  export let data: Submission;
</script>

<div class="w-full">
  <div
    class={`${data.user.id === $user.id ? 'w-10/12' : ''} max-w-full text-left`}
  >
    <div class="flex items-center">
      {#if data.song.albumArtwork}
        <img
          alt="Album Artwork"
          class="w-16 h-16 mr-2"
          src={data.song.albumArtwork}
        />
      {/if}
      <div class="flex flex-col">
        <span class={`w-full truncate text-${data.user.musicPlatform}`}>
          {data.song.name}
        </span>
        <span class="w-full truncate text-gray-100">
          {data.song.artist}
        </span>
      </div>
    </div>
  </div>
  {#if data.user.id === $user.id}
    <div class="w-2/12 text-right mb-1 flex flex-col-reverse gap-1">
      <MusicPlatformIcon
        id={data.user ? data.user.musicPlatform : 'spotify'}
        className="h-5 w-5 self-end ml-auto"
      />
    </div>
  {/if}
</div>
