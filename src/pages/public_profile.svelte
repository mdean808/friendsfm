<script lang="ts">
  import { onMount } from 'svelte';
  import {
    formatDurationPlayed,
    getFirebaseUrl,
    getPlatformColor,
    goto,
    handleApiResponse,
  } from '../lib';
  import {
    appCheckToken,
    authToken,
    loading,
    prevPath,
    publicProfileUsername,
    songs,
    toggleSong,
    user,
  } from '../store';
  import type { User } from '../types';

  let profile: User['profile'];

  onMount(async () => {
    loading.set(true);
    const res = await fetch(getFirebaseUrl('getprofile'), {
      method: 'POST',
      body: JSON.stringify({
        authToken: $authToken,
        username: $publicProfileUsername,
      }),
      headers: { 'X-Firebase-AppCheck': $appCheckToken },
    });

    const json = await handleApiResponse(res);
    if (!json) {
      // handle login failure
      loading.set(false);
      return;
    }
    profile = json.message as User['profile'];
    loading.set(false);
  });
  //todo: add share links, ability to add as a friend if you haven't friended them
</script>

<div class="bg-gray-900">
  <div class="sticky top-0 w-full mx-auto p-2">
    <button
      on:click={() => goto($prevPath)}
      class="absolute right-3 top-3 text-transparent"
      ><svg
        fill="none"
        class="w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-spotify"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
        ></path>
      </svg>
    </button>
    <div
      class="text-white mx-auto text-center py-2"
      style="height: calc(100% - 70px); overflow-y: scroll;"
    >
      <!-- User Info -->
      <div class="px-2">
        <div class="relative w-20 h-20 mx-auto">
          <img
            class="w-20 h-20 rounded-full mx-auto"
            alt="User Avatar"
            src={`https://icotar.com/avatar/${$publicProfileUsername}.svg`}
          />
        </div>
        <h1 class="py-2 font-semibold text-xl">{$publicProfileUsername}</h1>
        <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto" />
        <div class="py-1 flex max-h-20 h-14 w-full">
          {#if profile?.bio}
            <p
              class="align-middle self-center text-center w-full font-mono text-xs"
            >
              {profile?.bio}
            </p>
          {:else}
            <p
              class="text-gray-400 text-xs font-mono align-middle self-center text-center w-full"
            >
              {$publicProfileUsername} has no bio...
            </p>
          {/if}
        </div>
        <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto" />
      </div>
      <!-- User Favorites -->
      <div class="py-4 px-2">
        <h1 class={`font-semibold text-xl`}>favorites</h1>
        <div class="grid grid-cols-3 py-2">
          <div>
            {#if profile?.favorites?.song}
              <a
                target="_blank"
                href={profile.favorites.song.url}
                class="relative"
              >
                <img
                  alt="Song Artwork"
                  class="w-20 h-20 mx-auto rounded-sm"
                  src={profile.favorites.song.artwork}
                />
              </a>
              <p class="mt-1 text-sm">{profile.favorites.song.name}</p>
              <p class="mt-1 text-sm text-gray-400">
                {profile.favorites.song.artist}
              </p>
            {:else}
              <div
                class="p-5 border-2 borer-gray-600 rounded-md w-20 h-20 mx-auto transition-all duration-100"
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
              <p class="mt-1">no song</p>
            {/if}
          </div>
          <div>
            <div>
              {#if profile?.favorites?.album}
                <a
                  target="_blank"
                  href={profile.favorites.album.url}
                  class="relative"
                >
                  <img
                    alt="Song Artwork"
                    class="w-20 h-20 mx-auto rounded-sm"
                    src={profile.favorites.album.artwork}
                  />
                </a>
                <p class="mt-1 text-sm">{profile.favorites.album.name}</p>
                <p class="mt-1 text-sm text-gray-400">
                  {profile.favorites.album.artist}
                </p>
              {:else}
                <div
                  class="p-5 border-2 borer-gray-600 rounded-md w-20 h-20 mx-auto transition-all duration-100"
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
                <p class="mt-1">no album</p>
              {/if}
            </div>
          </div>
          <div>
            {#if profile?.favorites?.artist}
              <a
                target="_blank"
                href={profile.favorites.artist.url}
                class="relative"
              >
                <img
                  alt="Artist"
                  class="w-20 h-20 mx-auto rounded-sm"
                  src={profile.favorites.artist.artwork}
                />
              </a>
              <p class="text-sm mt-1">{profile.favorites.artist.name}</p>
            {:else}
              <div
                class="p-5 border-2 borer-gray-600 rounded-md w-20 h-20 mx-auto transition-all duration-100"
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
              <p class="mt-1">no artist</p>
            {/if}
          </div>
        </div>
      </div>
      <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto" />
      <!-- User Common Song -->
      {#if profile?.stats?.topSong}
        <h2 class="mt-3 mb-1 font-semibold text-xl">most common song</h2>
        <div
          class="text-left bg-gray-700 rounded-md px-2 mx-4 py-2 mb-2 flex space-x-4"
        >
          <a
            href={profile.stats.topSong.url}
            class="flex flex-grow items-center"
          >
            {#if profile.stats.topSong.albumArtwork}
              <div>
                <img
                  alt="Album Artwork"
                  class="w-16 h-16 mr-3 rounded-sm"
                  src={profile.stats.topSong.albumArtwork}
                />
              </div>
            {/if}
            <div class={profile.stats.topSong.albumArtwork ? 'w-52' : 'w-64'}>
              <h1
                class={`truncate text-${getPlatformColor($user.musicPlatform)}`}
              >
                {profile.stats.topSong.name}
              </h1>
              <p class="text-white truncate">
                {profile.stats.topSong.artist}
              </p>
              <p class="text-sm truncate text-gray-500">
                {formatDurationPlayed(profile.stats.topSong.length)}
              </p>
            </div>
          </a>
          <div class="flex-grow-0 flex-shrink">
            <svg
              on:click={() => toggleSong(profile.stats.topSong)}
              on:keypress={() => toggleSong(profile.stats.topSong)}
              class={`w-6 h-6 ml-auto flex-grow-0 flex-shrink ${
                $songs.find((s) => s.name === profile.stats.topSong.name) &&
                'text-pink-500'
              }`}
              fill={`${
                $songs.find((s) => s.name === profile.stats.topSong.name)
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
    </div>
  </div>
</div>
