<script lang="ts">
  import SpotifyLogo from '$assets/spotify_logo_green.png';
  import AppleMusicLogo from '$assets/apple_music_logo_white.svg';
  import { fade } from 'svelte/transition';
  import { Share } from '@capacitor/share';
  import { session } from '$lib/session';
  import { editingProfile, searchType } from '$lib/util';

  import Input from '$components/Input.svelte';
  import Skeleton from '$components/submission/Skeleton.svelte';

  import { MusicPlatform, type User } from '$lib/types';
  import { goto } from '$app/navigation';
  import { formatDurationPlayed } from '$lib/dates';
  import { getCurrentSong, getUserStatistics } from '$lib/user';
  import { onMount } from 'svelte';

  const firstOfTheMonth = new Date().getDate() === 1;

  const currentlyListening = async () => {
    const song = await getCurrentSong();
    return song;
  };

  onMount(async () => {
    // update user statistics
    const stats = await getUserStatistics(
      $session.user.id,
      $session.user.public.username
    );
    session.update((s) => {
      if (!s.user.public.profile)
        s.user.public.profile = {} as User['public']['profile'];
      s.user.public.profile.stats = stats;
      return s;
    });
  });

  let currentListeningPromise = currentlyListening();

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
        src={`https://icotar.com/avatar/${$session.user.public.username}.svg`}
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
    <h1 class="py-2 font-semibold text-xl">{$session.user.public.username}</h1>
    <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto" />
    <div class="py-1 flex max-h-20 h-14 w-full">
      {#if $editingProfile && $session.user.public.profile?.bio}
        <Input
          name="bio"
          maxlength="47"
          bind:value={$session.user.public.profile.bio}
          placeholder="Create a short bio..."
          className="font-mono text-xs text-center w-full"
          on:keyup={handleKeyup}
        />
      {:else if $session.user.public.profile?.bio}
        <p
          class="align-middle self-center text-center w-full font-mono text-xs"
        >
          {$session.user.public.profile?.bio}
        </p>
      {:else}
        <p
          class="text-gray-400 text-xs font-mono align-middle self-center text-center w-full"
        >
          {$session.user.public.username} has no bio...
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
            target={!$editingProfile ? '_blank' : null}
            href={!$editingProfile
              ? $session.user.public.musicPlatform === MusicPlatform.spotify
                ? 'https://open.spotify.com/track/29TPjc8wxfz4XMn21O7VsZ?si=a3f5cfd803754ea6'
                : 'https://music.apple.com/album/sky/1546163603?i=1546163990'
              : 'javascript: void(0)'}
          >
            <img
              alt="Song Artwork"
              class="w-20 h-20 mx-auto"
              src="https://upload.wikimedia.org/wikipedia/en/6/6c/Playboi_Carti_-_Whole_Lotta_Red.png"
            />
            {#if $editingProfile}
              <div
                role="presentation"
                transition:fade={{ duration: 100 }}
                on:click={(e) => {
                  e.preventDefault();
                  searchType.set('track');
                  goto('/modal/mp-search');
                }}
                on:keypress={(e) => {
                  e.preventDefault();
                  searchType.set('track');
                  goto('/modal/mp-search');
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
        {:else if $session.user.public.profile?.favorites?.song}
          <a
            target={!$editingProfile ? '_blank' : null}
            href={!$editingProfile
              ? $session.user.public.profile.favorites.song.url
              : 'javascript: void(0)'}
          >
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <img
              alt="Song Artwork"
              class="w-20 h-20 mx-auto"
              src={$session.user.public.profile.favorites.song.artwork}
              on:click={(e) => {
                if ($editingProfile) {
                  e.preventDefault();
                  searchType.set('track');
                  goto('/modal/mp-search');
                }
              }}
              on:keypress={(e) => {
                if ($editingProfile) {
                  e.preventDefault();
                  searchType.set('track');
                  goto('/modal/mp-search');
                }
              }}
            />
            {#if $editingProfile}
              <div
                role="presentation"
                transition:fade={{ duration: 100 }}
                on:click={(e) => {
                  e.preventDefault();
                  searchType.set('track');
                  goto('/modal/mp-search');
                }}
                on:keypress={(e) => {
                  e.preventDefault();
                  searchType.set('track');
                  goto('/modal/mp-search');
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
          <p class="mt-1 text-sm">
            {$session.user.public.profile.favorites.song.name}
          </p>
          <p class="mt-1 text-sm text-gray-400">
            {$session.user.public.profile.favorites.song.artist}
          </p>
        {:else}
          <div
            role="presentation"
            class="p-5 border-2 borer-gray-600 rounded-md w-20 h-20 mx-auto hover:border-blue-600 hover:text-blue-600 transition-all duration-100"
            on:click={() => {
              searchType.set('track');
              goto('/modal/mp-search');
            }}
            on:keyup={() => {
              searchType.set('track');
              goto('/modal/mp-search');
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
        {#if $session.user.public.profile?.favorites?.album}
          <a
            target={!$editingProfile ? '_blank' : null}
            href={!$editingProfile
              ? $session.user.public.profile.favorites.album.url
              : 'javascript: void(0)'}
          >
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <img
              alt="Song Artwork"
              class="w-20 h-20 mx-auto"
              src={$session.user.public.profile.favorites.album.artwork}
              on:click={(e) => {
                if ($editingProfile) {
                  e.preventDefault();
                  searchType.set('album');
                  goto('/modal/mp-search');
                }
              }}
              on:keypress={(e) => {
                if ($editingProfile) {
                  e.preventDefault();
                  searchType.set('album');
                  goto('/modal/mp-search');
                }
              }}
            />
            {#if $editingProfile}
              <div
                role="presentation"
                transition:fade={{ duration: 100 }}
                on:click={(e) => {
                  e.preventDefault();
                  searchType.set('album');
                  goto('/modal/mp-search');
                }}
                on:keypress={(e) => {
                  e.preventDefault();
                  searchType.set('album');
                  goto('/modal/mp-search');
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
          <p class="mt-1 text-sm">
            {$session.user.public.profile.favorites.album.name}
          </p>
          <p class="mt-1 text-sm text-gray-400">
            {$session.user.public.profile.favorites.album.artist}
          </p>
        {:else}
          <div
            role="presentation"
            class="p-5 border-2 borer-gray-600 rounded-md w-20 h-20 mx-auto hover:border-blue-600 hover:text-blue-600 transition-all duration-100"
            on:click={() => {
              searchType.set('album');
              goto('/modal/mp-search');
            }}
            on:keyup={() => {
              searchType.set('album');
              goto('/modal/mp-search');
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
        {#if $session.user.public.profile?.favorites?.artist}
          <a
            target={!$editingProfile ? '_blank' : null}
            href={!$editingProfile
              ? $session.user.public.profile.favorites.artist.url
              : 'javascript: void(0)'}
          >
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <img
              alt="Artist"
              class="w-20 h-20 mx-auto"
              src={$session.user.public.profile.favorites.artist.artwork}
              on:click={(e) => {
                if ($editingProfile) {
                  e.preventDefault();
                  searchType.set('artist');
                  goto('/modal/mp-search');
                }
              }}
              on:keypress={(e) => {
                if ($editingProfile) {
                  e.preventDefault();
                  searchType.set('artist');
                  goto('/modal/mp-search');
                }
              }}
            />
            {#if $editingProfile}
              <div
                role="presentation"
                transition:fade={{ duration: 100 }}
                on:click={() => {
                  searchType.set('artist');
                  goto('/modal/mp-search');
                }}
                on:keypress={() => {
                  searchType.set('artist');
                  goto('/modal/mp-search');
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
          <p class="text-sm mt-1">
            {$session.user.public.profile.favorites.artist.name}
          </p>
        {:else}
          <div
            role="presentation"
            class="p-5 border-2 borer-gray-600 rounded-md w-20 h-20 mx-auto hover:border-blue-600 hover:text-blue-600 transition-all duration-100"
            on:click={() => {
              searchType.set('artist');
              goto('/modal/mp-search');
            }}
            on:keyup={() => {
              searchType.set('artist');
              goto('/modal/mp-search');
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
    {#if $session.user.public.musicPlatform === MusicPlatform.spotify}
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
  {#await currentListeningPromise}
    <p class="h-5 my-1.5 rounded-md animate-pulse bg-gray-700 mx-auto w-1/2" />
    <div class="mx-4 mb-2">
      <Skeleton type="user" />
    </div>
  {:then song}
    {#if song}
      <h2 class="mt-2 mb-1 font-semibold text-xl">currently listening to</h2>
      <div
        class={`p-1 rounded-md mx-4 mb-2 bg-gradient-to-r from-${$session.user.public.musicPlatform} via-blue-500 to-${$session.user.public.musicPlatform} background-animate`}
      >
        <div
          class="text-left bg-gray-700 relative rounded-md px-2 py-2 flex space-x-4"
        >
          <!-- SONG DURATION BACKGROUND -->
          {#if song.timestamp === 0}
            <div
              style={`
            width: ${(song.durationElapsed / song.length) * 100}%
          `}
              class="absolute rounded-l-md left-0 top-0 right-0 h-full bg-blue-700 opacity-60 z-0"
            />
          {/if}
          <a href={song.url} class="flex sticky flex-grow items-center">
            {#if song.albumArtwork}
              <div>
                <img
                  alt="Album Artwork"
                  class="w-16 h-16 mr-3"
                  src={song.albumArtwork}
                />
              </div>
            {/if}
            <div class={song.albumArtwork ? 'w-52' : 'w-64'}>
              <h1 class={`truncate text-${$session.user.public.musicPlatform}`}>
                {song.name}
              </h1>
              <p class="text-white truncate">
                {song.artist}
              </p>
              <p class="text-sm truncate text-gray-500">
                {formatDurationPlayed(song.length)}
              </p>
            </div>
          </a>
          <div class="flex-grow-0 flex-shrink"></div>
        </div>
      </div>
    {:else}
      <!-- User Top Song -->
      {#if $session.user.public.profile?.stats?.topSong}
        <h2 class="mt-2 mb-1 font-semibold text-xl">most common song</h2>
        <div
          class="text-left bg-gray-700 rounded-md px-2 mx-4 py-2 mb-2 flex space-x-4"
        >
          <a
            href={$session.user.public.profile?.stats.topSong.url}
            class="flex flex-grow items-center"
          >
            {#if $session.user.public.profile?.stats.topSong.albumArtwork}
              <div>
                <img
                  alt="Album Artwork"
                  class="w-16 h-16 mr-3"
                  src={$session.user.public.profile?.stats.topSong.albumArtwork}
                />
              </div>
            {/if}
            <div
              class={$session.user.public.profile?.stats.topSong.albumArtwork
                ? 'w-52'
                : 'w-64'}
            >
              <h1 class={`truncate text-${$session.user.public.musicPlatform}`}>
                {$session.user.public.profile?.stats.topSong.name}
              </h1>
              <p class="text-white truncate">
                {$session.user.public.profile?.stats.topSong.artist}
              </p>
              <p class="text-sm truncate text-gray-500">
                {formatDurationPlayed(
                  $session.user.public.profile?.stats.topSong.length
                )}
              </p>
            </div>
          </a>
          <div class="flex-grow-0 flex-shrink">
            <svg
              role="presentation"
              class={`w-6 h-6 ml-auto flex-grow-0 flex-shrink`}
              fill={'transparent'}
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
    {/if}
  {/await}

  <p
    role="presentation"
    on:keyup={() =>
      Share.share({
        url:
          'https://friendsfm.app/user/' +
          $session.user.public.username +
          '?ref=' +
          $session.user.id,
      })}
    on:click={() =>
      Share.share({
        url:
          'https://friendsfm.app/user/' +
          $session.user.public.username +
          '?ref=' +
          $session.user.id,
      })}
    class="mx-auto text-center mt-3 text-gray-300 opacity-70 underline"
  >
    share your profile
  </p>
</div>
