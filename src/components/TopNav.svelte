<script>
  import { getPlatformColor, goto } from '../lib';

  import {
    createSongsSpotifyPlaylist,
    currPath,
    statusBarHeight,
    user,
  } from '../store';
</script>

<div
  style={`height: ${
    55 + $statusBarHeight
  }px; padding-top: ${$statusBarHeight}px`}
  class={`bg-gray-900 z-30 w-full`}
>
  <div
    class={`w-full flex p-3 flex-row justify-between items-center text-${getPlatformColor(
      $user?.musicPlatform
    )}`}
  >
    <button class="flex-grow-0 relative" on:click={() => goto('/friends')}>
      <svg
        class="w-8 h-8"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
        /></svg
      >
      {#if $user.friendRequests.length > 0}
        <div
          class="absolute inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full top-0 -right-2"
        >
          {$user.friendRequests.length > 9
            ? $user.friendRequests.length + '+'
            : $user.friendRequests.length}
        </div>
      {/if}
    </button>
    <h1 class="text-center mx-auto text-2xl text-white truncate flex-grow px-4">
      {$user.username}
    </h1>
    {#if $currPath === '/songs'}
      <button class="flex-grow-0" on:click={createSongsSpotifyPlaylist}>
        <svg
          fill="none"
          class="w-8 h-8"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
          />
        </svg>
      </button>
    {:else}
      <button class="flex-grow-0" on:click={() => goto('/settings')}>
        <svg
          class="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
            clip-rule="evenodd"
          /></svg
        >
      </button>
    {/if}
  </div>
</div>
