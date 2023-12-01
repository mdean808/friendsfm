<script lang="ts">
  import { onMount } from 'svelte';
  import SpotifyLogo from '../assets/spotify_logo_green.png';
  import AppleMusicLogo from '../assets/apple_music_logo_white.svg';
  import { formatDurationPlayed, getPlatformColor, goto } from '../lib';
  import {
    editingProfile,
    header,
    searchType,
    songs,
    toggleSong,
    user,
    userStatistics,
  } from '../store';
  import { fade } from 'svelte/transition';
  import Input from '../components/Input.svelte';
  import { MusicPlatform } from '../types';
  import { Share } from '@capacitor/share';

  const firstOfTheMonth = new Date().getDate() === 1;

  onMount(() => {
    header.set('profile');
  });

  const handleKeyup = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      (document.activeElement as HTMLInputElement).blur();
    }
  };
</script>

<div
  class="text-white mx-auto text-center"
  style="height: calc(100% - 70px); overflow-y: scroll;"
>
  <!-- User Info -->
  <div class="px-2">
    <div class="relative w-20 h-20 mx-auto">
      <img
        class="w-20 h-20 rounded-full mx-auto"
        alt="User Avatar"
        src={`https://icotar.com/avatar/${$user.username}.svg`}
      />
      <!--      {#if $editingProfile}
        <button
          on:click={() => console.log('goto emoji editor')}
          class="absolute bg-white text-black p-1 w-6 h-6 right-0 top-0 rounded-full"
        >
          <svg
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z"
            ></path>
          </svg>
        </button>
      {/if-->
    </div>
    <h1 class="py-2 font-semibold text-xl">{$user.username}</h1>
    <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto" />
    <div class="py-1 flex max-h-20 h-14 w-full">
      {#if $editingProfile}
        <Input
          name="bio"
          maxlength="47"
          bind:value={$user.profile.bio}
          placeholder="Create a short bio..."
          className="font-mono text-xs text-center w-full"
          on:keyup={handleKeyup}
        />
      {:else if $user.profile?.bio}
        <p
          class="align-middle self-center text-center w-full font-mono text-xs"
        >
          {$user.profile?.bio}
        </p>
      {:else}
        <p
          class="text-gray-400 text-xs font-mono align-middle self-center text-center w-full"
        >
          {$user.username} has no bio...
        </p>
      {/if}
    </div>

    <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto" />
  </div>
  <!-- User Favorites -->
  <div class="py-2 px-2">
    <div class="grid grid-cols-3 py-2">
      <div class="relative">
        {#if firstOfTheMonth}
          <a
            target="_blank"
            href={$user.musicPlatform === MusicPlatform.spotify
              ? 'https://open.spotify.com/track/30LPShuvQhZU4JVy95VTtM?autoplay=true'
              : 'https://music.apple.com/album/sky/1546163603?i=1546163990'}
          >
            <img
              alt="Song Artwork"
              class="w-20 h-20 mx-auto"
              src="https://upload.wikimedia.org/wikipedia/en/6/6c/Playboi_Carti_-_Whole_Lotta_Red.png"
            />
            {#if $editingProfile}
              <div
                transition:fade={{ duration: 100 }}
                on:click={(e) => {
                  e.preventDefault();
                  searchType.set('track');
                  goto('/search_music_platform');
                }}
                on:keypress={(e) => {
                  e.preventDefault();
                  searchType.set('track');
                  goto('/search_music_platform');
                }}
                class="absolute bg-white text-black p-1 w-6 h-6 right-3.5 -top-2.5 rounded-full"
              >
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z"
                  ></path>
                </svg>
              </div>
            {/if}
          </a>
          <p class="mt-1 text-sm">Sky</p>
          <p class="mt-1 text-sm text-gray-400">Playboi Carti</p>
        {:else if $user.profile?.favorites?.song}
          <a target="_blank" href={$user.profile.favorites.song.url}>
            <img
              alt="Song Artwork"
              class="w-20 h-20 mx-auto"
              src={$user.profile.favorites.song.artwork}
            />
            {#if $editingProfile}
              <div
                transition:fade={{ duration: 100 }}
                on:click={(e) => {
                  e.preventDefault();
                  searchType.set('track');
                  goto('/search_music_platform');
                }}
                on:keypress={(e) => {
                  e.preventDefault();
                  searchType.set('track');
                  goto('/search_music_platform');
                }}
                class="absolute bg-white text-black p-1 w-6 h-6 right-3.5 -top-2.5 rounded-full"
              >
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z"
                  ></path>
                </svg>
              </div>
            {/if}
          </a>
          <p class="mt-1 text-sm">{$user.profile.favorites.song.name}</p>
          <p class="mt-1 text-sm text-gray-400">
            {$user.profile.favorites.song.artist}
          </p>
        {:else}
          <div
            class="p-5 border-2 borer-gray-600 rounded-md w-20 h-20 mx-auto hover:border-blue-600 hover:text-blue-600 transition-all duration-100"
            on:click={() => {
              searchType.set('track');
              goto('/search_music_platform');
            }}
            on:keyup={() => {
              searchType.set('track');
              goto('/search_music_platform');
            }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              class="w-full h-full"
              stroke-width="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
              ></path>
            </svg>
          </div>
          <p class="mt-1">choose song</p>
        {/if}
      </div>
      <div class="relative">
        {#if $user.profile?.favorites?.album}
          <a target="_blank" href={$user.profile.favorites.album.url}>
            <img
              alt="Song Artwork"
              class="w-20 h-20 mx-auto"
              src={$user.profile.favorites.album.artwork}
            />
            {#if $editingProfile}
              <div
                transition:fade={{ duration: 100 }}
                on:click={(e) => {
                  e.preventDefault();
                  searchType.set('album');
                  goto('/search_music_platform');
                }}
                on:keypress={(e) => {
                  e.preventDefault();
                  searchType.set('album');
                  goto('/search_music_platform');
                }}
                class="absolute bg-white text-black p-1 w-6 h-6 right-3.5 -top-2.5 rounded-full"
              >
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z"
                  ></path>
                </svg>
              </div>
            {/if}
          </a>
          <p class="mt-1 text-sm">{$user.profile.favorites.album.name}</p>
          <p class="mt-1 text-sm text-gray-400">
            {$user.profile.favorites.album.artist}
          </p>
        {:else}
          <div
            class="p-5 border-2 borer-gray-600 rounded-md w-20 h-20 mx-auto hover:border-blue-600 hover:text-blue-600 transition-all duration-100"
            on:click={() => {
              searchType.set('album');
              goto('/search_music_platform');
            }}
            on:keyup={() => {
              searchType.set('album');
              goto('/search_music_platform');
            }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              class="w-full h-full"
              stroke-width="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
              ></path>
            </svg>
          </div>
          <p class="mt-1">choose album</p>
        {/if}
      </div>
      <div class="relative">
        {#if $user.profile?.favorites?.artist}
          <a target="_blank" href={$user.profile.favorites.artist.url}>
            <img
              alt="Artist"
              class="w-20 h-20 mx-auto"
              src={$user.profile.favorites.artist.artwork}
            />
            {#if $editingProfile}
              <div
                transition:fade={{ duration: 100 }}
                on:click={() => {
                  searchType.set('artist');
                  goto('/search_music_platform');
                }}
                on:keypress={() => {
                  searchType.set('artist');
                  goto('/search_music_platform');
                }}
                class="absolute bg-white text-black p-1 w-6 h-6 right-3.5 -top-2.5 rounded-full"
              >
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z"
                  ></path>
                </svg>
              </div>
            {/if}
          </a>
          <p class="text-sm mt-1">{$user.profile.favorites.artist.name}</p>
        {:else}
          <div
            class="p-5 border-2 borer-gray-600 rounded-md w-20 h-20 mx-auto hover:border-blue-600 hover:text-blue-600 transition-all duration-100"
            on:click={() => {
              searchType.set('artist');
              goto('/search_music_platform');
            }}
            on:keyup={() => {
              searchType.set('artist');
              goto('/search_music_platform');
            }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              class="w-full h-full"
              stroke-width="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              ></path>
            </svg>
          </div>
          <p class="mt-1">choose artist</p>
        {/if}
      </div>
    </div>
    {#if $user.musicPlatform === MusicPlatform.spotify}
      <img alt="spotify logo" class="h-4 my-1 mx-auto" src={SpotifyLogo} />
    {:else}<!-- apple music icon-->
      <img
        alt="apple music logo"
        class="h-4 my-1 mx-auto"
        src={AppleMusicLogo}
      />
    {/if}
  </div>
  <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto" />
  <!-- User Common Song -->
  {#if $userStatistics?.topSong}
    <h2 class="mt-2 mb-1 font-semibold text-xl">most common song</h2>
    <div
      class="text-left bg-gray-700 rounded-md px-2 mx-4 py-2 mb-2 flex space-x-4"
    >
      <a href={$userStatistics.topSong.url} class="flex flex-grow items-center">
        {#if $userStatistics.topSong.albumArtwork}
          <div>
            <img
              alt="Album Artwork"
              class="w-16 h-16 mr-3"
              src={$userStatistics.topSong.albumArtwork}
            />
          </div>
        {/if}
        <div class={$userStatistics.topSong.albumArtwork ? 'w-52' : 'w-64'}>
          <h1 class={`truncate text-${getPlatformColor($user.musicPlatform)}`}>
            {$userStatistics.topSong.name}
          </h1>
          <p class="text-white truncate">
            {$userStatistics.topSong.artist}
          </p>
          <p class="text-sm truncate text-gray-500">
            {formatDurationPlayed($userStatistics.topSong.length)}
          </p>
        </div>
      </a>
      <div class="flex-grow-0 flex-shrink">
        <svg
          on:click={() => toggleSong($userStatistics.topSong)}
          on:keypress={() => toggleSong($userStatistics.topSong)}
          class={`w-6 h-6 ml-auto flex-grow-0 flex-shrink ${
            $songs.find((s) => s.name === $userStatistics.topSong.name) &&
            'text-pink-500'
          }`}
          fill={`${
            $songs.find((s) => s.name === $userStatistics.topSong.name)
              ? 'currentColor'
              : 'transparent'
          }`}
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
      </div>
    </div>
  {/if}

  <p
    on:keyup={() =>
      Share.share({
        url: 'https://friendsfm.mogdan.xyz/user/' + $user.username,
      })}
    on:click={() =>
      Share.share({
        url: 'https://friendsfm.mogdan.xyz/user/' + $user.username,
      })}
    class="mx-auto text-center mt-3 text-gray-300 opacity-70 underline"
  >
    share your profile
  </p>
</div>
