<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { type UserProfile, MusicPlatform } from '../../../types';
  let username = $page.params.username;
  let profile: UserProfile;

  onMount(async () => {
    const res = await fetch('https://getprofile-tprlxlzyxq-uc.a.run.app', {
      method: 'POST',
      body: JSON.stringify({
        username: username,
      }),
    });
    const json = await res.json();
    profile = json.message;
  });

  export const formatDurationPlayed = (duration: number) => {
    const d = new Date(Date.UTC(0, 0, 0, 0, 0, 0, duration * 1000));
    return d.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
  };
</script>

<svelte:head>
  <meta property="og:title" content={`${username} | FriendsFM`} />
  <meta property="og:site_name" content="FriendsFM" />
  <meta property="og:url" content={`https://friendsfm.app/user/{username}`} />
  <meta
    property="og:description"
    content={`listen with ${username} on FriendsFM`}
  />
</svelte:head>

<div class="w-full mx-auto p-2">
  <div class="text-white mx-auto text-center py-2">
    <div class="w-full mx-auto pb-1 border-b-2 border-white">
      <p>Join FriendsFM to see what {username} is listening to!</p>
      <div class="flex mx-auto w-full items-center place-content-center gap-5">
        <a
          href="https://apps.apple.com/us/app/friendsfm/id6445926913"
          target="_blank"
        >
          <img
            src="/img/app_store_badge.svg"
            class="w-36"
            alt="download on the app store"
          /></a
        >
        <a
          href="https://play.google.com/store/apps/details?id=xyz.mogdan.friendsfm"
          target="_blank"
        >
          <img
            src="/img/google_play_badge.png"
            class="w-48 py-1"
            alt="download on google play store"
          />
        </a>
      </div>
      <p>
        Add <span class="text-blue-500">{username}</span> in the FriendsFM app after
        creating your account.
      </p>
    </div>
    <!-- User Info -->
    <div class="px-2 pt-5">
      <div class="relative w-20 h-20 mx-auto">
        <img
          class="w-20 h-20 rounded-full mx-auto"
          alt="User Avatar"
          src={`https://icotar.com/avatar/${username}.svg`}
        />
      </div>
      <h1 class="py-2 font-semibold text-xl">{username}</h1>
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
            {username} has no bio...
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
                class="w-20 h-20 mx-auto"
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
          {#if profile?.favorites?.artist}
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
      {#if profile?.musicPlatform === MusicPlatform.spotify}
        <img
          alt="spotify logo"
          class="h-4 my-1 mx-auto"
          src="/img/spotify_logo_green.png"
        />
      {:else if profile?.musicPlatform === MusicPlatform.appleMusic}
        <img
          alt="apple music logo"
          class="h-4 my-1 mx-auto"
          src="/img/apple_music_logo_white.svg"
        />
      {/if}
    </div>
    <hr class="w-28 border-gray-400 border-[1.5px] rounded-full mx-auto" />
    <!-- User Common Song -->
    {#if profile?.stats?.topSong}
      <h2 class="mt-3 mb-1 font-semibold text-xl">most common song</h2>
      <div
        class="text-left bg-gray-700 rounded-md px-2 mx-4 py-2 mb-2 flex space-x-4"
      >
        <a href={profile.stats.topSong.url} class="flex flex-grow items-center">
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
            <h1 class={`truncate text-${profile?.musicPlatform}`}>
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
        <div class="flex-grow-0 flex-shrink"></div>
      </div>
    {/if}
  </div>
</div>
