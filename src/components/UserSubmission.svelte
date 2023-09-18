<script lang="ts">
  import {
    convertDateToLateString,
    formatTimePlayed,
    getDaysAgo,
    getPlatformColor,
    goto,
  } from '../lib';
  import type { SavedSong, Submission } from '../types';
  import { toggleSong, songs, activeSubmission } from '../store';

  export let data: Submission;

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
      },
    };
    await toggleSong(savedSong);
    loadingHeart = false;
  };

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
  <div>
    <div class="relative">
      {#if data.song.timestamp === 0}
        <div
          style={`
      width: ${(data.song.durationElapsed / data.song.length) * 100}%
      `}
          class="absolute rounded-l-lg left-0 right-0 h-full bg-blue-700 opacity-60 z-0"
        />
      {/if}

      <div class="sticky px-2 py-2">
        <div class="flex">
          <div>
            {#if !data.late}
              <span class="text-sm text-gray-400"
                >{new Date(data.time).toLocaleString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                })}
              </span>
            {:else}
              <span class="text-sm text-red-500">
                {convertDateToLateString(new Date(data.lateTime))}
              </span>
            {/if}
            {#if data.song.timestamp > 0}
              -
              <span class="text-gray-400 w-8/12 text-sm">
                played {getDaysAgo(new Date(data.song?.timestamp))}
                {#if !getDaysAgo(new Date(data.song?.timestamp)).includes('days ago')}at
                  {formatTimePlayed(data.song?.timestamp)}
                {/if}
              </span>
            {/if}
          </div>
          <div class="ml-auto flex gap-2 flex-grow-0 flex-shrink">
            <div class="flex text-lg gap-2">
              <svg
                on:click={toggleHeart}
                on:keypress={toggleHeart}
                class={`w-6 h-6 flex-grow-0 flex-shrink ${
                  loadingHeart ? 'animate-ping text-pink-500' : ''
                } ${
                  $songs.find((s) => s.name === data.song.name)
                    ? 'text-pink-500'
                    : ''
                } `}
                fill={$songs.find((s) => s.name === data.song.name)
                  ? 'currentColor'
                  : 'none'}
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
              <div class="relative">
                <div
                  class={`absolute inline-flex items-center justify-center w-4 h-4 text-xs pt-0.5 font-bold text-gray-600 bg-white rounded-full -top-1 -right-1`}
                >
                  {data.comments.length > 9 ? 9 + '+' : data.comments.length}
                </div>
                <svg
                  fill="none"
                  class="w-6 h-6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="flex">
          <div class="w-[64%] text-left">
            <div class="flex mb-1 mt-0.5">
              {#if data.song.albumArtwork}
                <img
                  alt="Album Artwork"
                  class="w-1/4 mr-2 max-w-[3rem] max-h-[3rem] rounded-sm"
                  src={data.song.albumArtwork}
                />
              {/if}
              <div class="w-3/4 flex flex-col items-end pr-3 justify-end">
                <span
                  class={`w-full truncate text-${getPlatformColor(
                    data.user.musicPlatform
                  )}`}
                >
                  {data.song.name}
                </span>
                <span class="w-full truncate text-gray-100">
                  {data.song.artist}
                </span>
              </div>
            </div>
          </div>
          <div class="w-[36%] text-right mb-1 flex">
            {#if data.audial && data.audial.number != -1}
              <div class="text-xs self-end text-right w-full">
                <p class="text-sm text-right">audial #{data.audial.number}</p>
                {data.audial.score}
              </div>
            {:else}
              <button
                class="text-blue-500 text-right text-sm underline self-end w-full"
                on:click={() => goto('/paste_audial')}>share audial</button
              >
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
