<script lang="ts">
  import { songs, toggleSong } from '../../store';
  import type { SavedSong, Submission } from '../../types';
  import Heart from '../icons/Heart.svelte';
  import Comment from '../icons/Comment.svelte';

  export let data: Submission;
  export let className: string = '';
  export let commentNumberColor: string = 'text-gray-600';

  let loadingHeart = false;

  const toggleHeart = async (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    if (loadingHeart) return;
    loadingHeart = true;
    const savedSong: SavedSong = {
      ...data.song,
      user: {
        id: data.user.id,
        username: data.user.username,
        musicPlatform: data.user.musicPlatform,
      },
    };
    await toggleSong(savedSong);
    loadingHeart = false;
  };
</script>

<div class={className}>
  <div class="flex text-lg gap-2">
    <Heart
      on:click={toggleHeart}
      on:keypress={toggleHeart}
      className={`w-6 h-6 flex-grow-0 flex-shrink ${
        loadingHeart ? 'animate-ping text-white' : ''
      } ${$songs.find((s) => s.name === data.song.name) ? 'text-white' : ''} `}
      fill={$songs.find((s) => s.name === data.song.name)
        ? 'currentColor'
        : 'none'}
    />
    <div class="relative">
      <div
        class={`absolute inline-flex items-center justify-center w-4 h-4 text-xs pt-0.5 font-bold ${commentNumberColor} bg-white rounded-full -top-1 -right-1`}
      >
        {data.comments.length > 9 ? 9 + '+' : data.comments.length}
      </div>
      <Comment className="w-6 h-6" />
    </div>
  </div>
</div>