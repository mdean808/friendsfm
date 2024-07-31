<script lang="ts">
  import type { Submission } from '$lib/types';
  import MusicPlatformIcon from '$components/icons/MusicPlatformIcon.svelte';
  import { session } from '$lib/session';

  export let data: Submission;
</script>

<div class="w-full flex mb-1">
  <div
    class={`${data.user.id === $session.user.id ? 'w-10/12' : ''} max-w-full text-left`}
  >
    <div class="flex items-normal">
      {#if data.song.albumArtwork}
        <img
          alt="Album Artwork"
          class="w-14 h-14 mr-2 mt-1"
          src={data.song.albumArtwork}
        />
      {/if}
      <div class="flex flex-col">
        <span class={`w-full text-${data.user.musicPlatform}`}>
          {data.song.name}
        </span>
        <span class="w-full text-gray-100">
          {data.song.artist}
        </span>
      </div>
    </div>
  </div>
  {#if data.user.id === $session.user.id}
    <div class="w-2/12 text-right mb-1 flex flex-col-reverse gap-1">
      <MusicPlatformIcon
        id={data.user ? data.user.musicPlatform : 'spotify'}
        className="h-5 w-5 self-end ml-auto"
      />
    </div>
  {/if}
</div>
