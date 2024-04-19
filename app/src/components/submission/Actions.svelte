<script lang="ts">
  import { goto, hashCode, intToRGB } from '../../lib/util';
  import {
    activeGenre,
    activeHomeTab,
    activeSubmission,
    getNearbySubmissions,
    toggleLike,
    user as userStore,
  } from '../../store';
  import type { Submission } from '../../types';
  import Heart from '../icons/Heart.svelte';
  import Comment from '../icons/Comment.svelte';
  import MusicPlatformIcon from '../icons/MusicPlatformIcon.svelte';

  export let data: Submission;
  export let className: string = '';
  export let commentNumberColor: string = 'text-gray-600';
  export let user = false;

  let loadingHeart = false;

  const toggleHeart = async (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    if (loadingHeart) return;
    loadingHeart = true;
    data.likes = await toggleLike(data.id);
    loadingHeart = false;
  };
</script>

<div class={className}>
  <div class={`flex text-lg gap-2`}>
    <span
      on:keyup={(e) => {
        e.stopPropagation();
        activeGenre.set(data.song.genre);
        activeSubmission.set(data);
        activeHomeTab.set('genres');
        getNearbySubmissions(null, {
          southWest: {
            latitude: data.location.latitude - 5,
            longitude: data.location.longitude - 5,
          },
          northEast: {
            latitude: data.location.latitude + 5,
            longitude: data.location.longitude + 5,
          },
        });
        goto('/');
      }}
      on:click={(e) => {
        e.stopPropagation();
        activeGenre.set(data.song.genre);
        activeSubmission.set(data);
        activeHomeTab.set('genres');
        goto('/');
      }}
      class="px-1.5 py-1 h-7 border-white whitespace-nowrap border text-sm text-center text-white text-md rounded-xl"
      style={`background: ${intToRGB(hashCode(data.song.genre, 23))}`}
      >{data.song.genre}</span
    >
    {#if user}
      <div class="relative flex-grow-0 flex-shrink">
        <div
          class={`absolute inline-flex items-center justify-center w-4 h-4 text-xs pt-0.5 font-bold ${commentNumberColor} bg-white rounded-full -top-1 -right-1`}
        >
          {data.likes.length > 9 ? 9 + '+' : data.likes.length}
        </div>
        <Heart
          on:click={toggleHeart}
          on:keypress={toggleHeart}
          className={`w-6 h-6 flex-grow-0 flex-shrink ${
            loadingHeart ? 'animate-ping text-white' : ''
          } ${
            data?.likes?.find((l) => l.id === $userStore.id) ? 'text-white' : ''
          } `}
          fill={data?.likes?.find((l) => l.id === $userStore.id)
            ? 'currentColor'
            : 'none'}
        />
      </div>
      <div class="relative">
        <div
          class={`absolute inline-flex items-center justify-center w-4 h-4 text-xs pt-0.5 font-bold ${commentNumberColor} bg-white rounded-full -top-1 -right-1`}
        >
          {data.comments.length > 9 ? 9 + '+' : data.comments.length}
        </div>
        <Comment className="w-6 h-6" />
      </div>
    {:else}
      <MusicPlatformIcon
        id={data.user ? data.user.musicPlatform : 'spotify'}
        className="h-5 w-5 self-center ml-auto"
      />
    {/if}
  </div>
</div>
