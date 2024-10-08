<script lang="ts">
  import { Share } from '@capacitor/share';
  import SpotifyLogo from '$assets/spotify_logo_green.png';
  import AppleMusicLogo from '$assets/apple_music_logo_white.svg';
  import { onMount } from 'svelte';
  import Skeleton from '$components/submission/Skeleton.svelte';
  import { MusicPlatform, type User } from '$lib/types';
  import { loading, prevPath, publicProfileUsername, showToast } from '$lib/util';
  import { goto } from '$app/navigation';
  import { getCurrentSong, getUserStatistics } from '$lib/user';
  import { sendFriendRequest } from '$lib/friends';
  import { session } from '$lib/session';
  import { formatDurationPlayed } from '$lib/dates';
  import { toggleSong } from '$lib/songs';
  import { FirebaseFirestore } from '@capacitor-firebase/firestore';
  import { Clipboard } from '@capacitor/clipboard';
  import { Capacitor } from '@capacitor/core';

  let profile: User['public']['profile'];
  const firstOfTheMonth = new Date().getDate() === 1;
  let loadingProfile = true;

  onMount(async () => {
    const {snapshots} = await FirebaseFirestore.getCollectionGroup({
      reference: 'public',
      compositeFilter: {
        type: 'and',
        queryConstraints: [
          {
            type: 'where',
            fieldPath: 'username',
            opStr: '==',
            value: $publicProfileUsername,
          },
        ],
      },
    });
    const publicInfo = snapshots[0].data as User['public'];
    if (!publicInfo) {
      goto($prevPath);
      return;
    }

    if (!publicInfo.profile) {
      publicInfo.profile = {
        musicPlatform: publicInfo.musicPlatform,
      } as User['public']['profile'];
    }
    profile = publicInfo.profile;
    if (!profile.musicPlatform)
      profile.musicPlatform = publicInfo.musicPlatform;
    // load the stats!
    profile.stats = await getUserStatistics(
      snapshots[0].path.split('/')[1], // 'id' is 'info', so we must use 'path' to retrieve the userId
      $publicProfileUsername
    );
    loadingProfile = false;
  });

  const currentlyListening = async () => {
    return await getCurrentSong(undefined, $publicProfileUsername);
  };

  let currentListeningPromise = currentlyListening();

  const requestFriend = async () => {
    loading.set(true);
    if (await sendFriendRequest($publicProfileUsername.trim())) {
      showToast({content: 'Successfully sent friend request'});
    }
    loading.set(false);
  };
</script>

<button
    on:click={() => {
    if (Capacitor.getPlatform() === 'web') {
      Clipboard.write({
        string: `https://friendsfm.app/user/${$publicProfileUsername}`,
      });
    } else {
      Share.share({
        url: `https://friendsfm.app/user/${$publicProfileUsername}`,
      });
    }
  }}
    class="absolute left-3 top-3 text-transparent"
>
  <svg
      class={`w-8 h-8 p-1 border-gray-700 rounded-md border text-blue-500`}
      fill="currentColor"
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
  >
    <path
        d="M216,112v96a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112A16,16,0,0,1,56,96H80a8,8,0,0,1,0,16H56v96H200V112H176a8,8,0,0,1,0-16h24A16,16,0,0,1,216,112ZM93.66,69.66,120,43.31V136a8,8,0,0,0,16,0V43.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,69.66Z"
    ></path>
  </svg>
</button>
{#if !$session.user.friends.find((f) => f.username === $publicProfileUsername) && $publicProfileUsername !== $session.user.public.username}
  <button
      on:click={requestFriend}
      class="absolute left-14 top-3 text-transparent"
  >
    <svg
        class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-blue-500`}
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
      <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
      ></path>
    </svg>
  </button>
{/if}
<button
    on:click={() => goto($prevPath)}
    class="absolute right-3 top-3 text-transparent"
>
  <svg
      class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-${
      profile?.musicPlatform || $session.user.public.musicPlatform
    }`}
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
  >
    <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 18L18 6M6 6l12 12"
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
    <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto"/>
    <div class="py-1 flex max-h-20 h-14 w-full">
      {#if loadingProfile}
        <p
            class="align-middle self-center mx-auto h-4 w-44 rounded-md animate-pulse bg-gray-700"
        />
      {:else if profile?.bio}
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
    <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto"/>
  </div>
  <!-- User Favorites -->
  <div class="py-4 px-2">
    <h1 class={`font-semibold text-xl`}>favorites</h1>
    <div class="grid grid-cols-3 py-2">
      <div>
        {#if firstOfTheMonth}
          <a
              target="_blank"
              href={$session.user.public.musicPlatform === MusicPlatform.spotify
              ? 'https://open.spotify.com/track/29TPjc8wxfz4XMn21O7VsZ?si=a3f5cfd803754ea6'
              : 'https://music.apple.com/album/sky/1546163603?i=1546163990'}
          >
            <img
                alt="Song Artwork"
                class="w-20 h-20 mx-auto"
                src="https://upload.wikimedia.org/wikipedia/en/6/6c/Playboi_Carti_-_Whole_Lotta_Red.png"
            />
          </a>
          <p class="mt-1 text-sm">Sky</p>
          <p class="mt-1 text-sm text-gray-400">Playboi Carti</p>
        {:else if loadingProfile}
          <div
              class="p-5 border-2 border-gray-700 bg-gray-700 rounded-md w-20 h-20 mx-auto animate-pulse transition-all duration-100"
          />
        {:else if profile?.favorites?.song}
          <a target="_blank" href={profile.favorites.song.url} class="relative">
            <img
                alt="Song Artwork"
                class="w-20 h-20 mx-auto"
                src={profile.favorites.song.artwork}
            />
          </a>
          <p class={`mt-1 text-sm text-${profile.musicPlatform}`}>
            {profile.favorites.song.name}
          </p>
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
          {#if loadingProfile}
            <div
                class="p-5 border-2 border-gray-700 bg-gray-700 rounded-md w-20 h-20 mx-auto animate-pulse transition-all duration-100"
            />
          {:else if profile?.favorites?.album}
            <a
                target="_blank"
                href={profile.favorites.album.url}
                class="relative"
            >
              <img
                  alt="Song Artwork"
                  class="w-20 h-20 mx-auto"
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
        {#if loadingProfile}
          <div
              class="p-5 border-2 border-gray-700 bg-gray-700 rounded-md w-20 h-20 mx-auto animate-pulse transition-all duration-100"
          />
        {:else if profile?.favorites?.artist}
          <a
              target="_blank"
              href={profile.favorites.artist.url}
              class="relative"
          >
            <img
                alt="Artist"
                class="w-20 h-20 mx-auto"
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

    {#if loadingProfile}
      <div class="h-5 w-12 rounded-md bg-gray-700 mx-auto animate-pulse"></div>
    {:else if profile?.musicPlatform === MusicPlatform.spotify}
      <img alt="spotify logo" class="h-4 my-1 mx-auto" src={SpotifyLogo}/>
    {:else if profile?.musicPlatform === MusicPlatform.appleMusic}
      <img
          alt="apple music logo"
          class="h-4 my-1 mx-auto"
          src={AppleMusicLogo}
      />
    {/if}
  </div>
  <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto"/>

  {#await currentListeningPromise}
    <p class="h-5 my-1.5 rounded-md animate-pulse bg-gray-700 mx-auto w-1/2"/>
    <div class="mx-4 mb-2">
      <Skeleton type="user"/>
    </div>
  {:then song}
    {#if song}
      <h2 class="mt-2 mb-1 font-semibold text-xl">
        {$publicProfileUsername} is listening to
      </h2>
      <div
          class={`p-1 rounded-md mx-4 mb-2 bg-gradient-to-r from-${profile?.musicPlatform} via-blue-500 to-${profile?.musicPlatform} background-animate`}
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
              <h1 class={`truncate text-${profile?.musicPlatform}`}>
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
      {#if loadingProfile}
        <p
            class="h-5 my-1.5 rounded-md animate-pulse bg-gray-700 mx-auto w-1/2"
        />
        <div class="mx-4 mb-2">
          <Skeleton type="user"/>
        </div>
      {:else if profile.stats.topSong}
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
                    class="w-16 h-16 mr-3"
                    src={profile.stats.topSong.albumArtwork}
                />
              </div>
            {/if}
            <div class={profile.stats.topSong.albumArtwork ? 'w-52' : 'w-64'}>
              <h1 class={`truncate text-${profile.musicPlatform}`}>
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
                role="presentation"
                on:click={() => toggleSong(profile.stats.topSong)}
                on:keypress={() => toggleSong(profile.stats.topSong)}
                class={`w-6 h-6 ml-auto flex-grow-0 flex-shrink ${
                $session.songs.find(
                  (s) => s.name === profile?.stats.topSong?.name
                ) && 'text-white'
              }`}
                fill={`${
                $session.songs.find(
                  (s) => s.name === profile?.stats.topSong?.name
                )
                  ? 'currentColor'
                  : 'transparent'
              }`}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg
            >
          </div>
        </div>
      {/if}
    {/if}
  {/await}
</div>
