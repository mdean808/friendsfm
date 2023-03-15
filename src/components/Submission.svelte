<script lang="ts">
  import {
    getPlatformColor,
    formatDurationPlayed,
    formatTimePlayed,
    convertDateToLateString,
    getDaysAgo,
  } from '../lib';
  import MusicPlatformIcon from './MusicPlatformIcon.svelte';
  import type { SavedSong, Submission } from '../types';
  import { toggleSong, songs } from '../store';

  export let data: Submission;

  let loadingHeart = false;
  const toggleHeart = async () => {
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
</script>

<div class="border-2 border-gray-600 rounded-md py-2 px-2 ">
  <div class="flex">
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
          <span class="text-sm text-red-500">
            {convertDateToLateString(new Date(data.lateTime))}
            <!-- {new Date(data.time).toLocaleString('en-US', { -->
            <!--   hour: 'numeric', -->
            <!--   minute: 'numeric', -->
            <!--   hour12: true, -->
            <!-- })} -->
          </span>
        {/if}
      </h4>
      <a href={data.song.url}>
        <p class={`text-${getPlatformColor(data.user.musicPlatform)}`}>
          {data.song.name}
        </p>
        <p>{data.song.artist}</p>
        <p class="text-gray-400 w-8/12 text-sm">
          {#if data.song.timestamp > 0}
            song played {getDaysAgo(new Date(data.song?.timestamp))} at {formatTimePlayed(
              data.song?.timestamp
            )}
          {/if}
        </p>
      </a>
    </div>
    <div class="flex-grow-0 text-right">
      <div class="h-full flex flex-col flex-nowrap justify-between">
        <svg
          on:click={toggleHeart}
          on:keypress={toggleHeart}
          class={`w-6 h-6 ml-auto flex-grow-0 flex-shrink ${
            loadingHeart ? 'animate-ping text-pink-500' : ''
          } ${
            $songs.find((s) => s.name === data.song.name) ? 'text-pink-500' : ''
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
        <div class="text-sm flex-grow-0 flex-shrink">
          {#if data.audial && data.audial.number != -1}
            <p>audial #{data.audial.number}</p>
            {data.audial.score}
          {:else}
            <!-- no audial... -->
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if data.song.timestamp === 0}
    <div class="flex items-center mt-4">
      <span class="h-5 text-sm"
        >{formatDurationPlayed(data.song.durationElapsed)}</span
      >
      <div class="w-full mx-2 my-auto ray-200 rounded-full h-1 bg-gray-600">
        <div
          class="bg-blue-500 h-1 rounded-full"
          style={`width: ${
            (data.song.durationElapsed / data.song.length) * 100
          }%`}
        />
      </div>
      <span class="h-5 text-sm">{formatDurationPlayed(data.song.length)}</span>
    </div>
  {/if}
</div>
