<script lang="ts">
  import SpotifyLogo from '../assets/spotify_logo_green.png';
  import AppleMusicLogo from '../assets/apple_music_logo_white.svg';
  import {
    getFirebaseUrl,
    getPlatformColor,
    goto,
    handleApiResponse,
  } from '../lib';
  import {
    appCheckToken,
    authToken,
    loading,
    searchType,
    setProfile,
    user,
  } from '../store';
  import {
    MusicPlatform,
    type SpotifyAlbum,
    type SpotifyArtist,
    type SpotifySearchRes,
    type SpotifyTrack,
    type User,
    type MusicKitSearchResponse,
  } from '../types';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';

  let query: string;
  let searching = false;
  let input: HTMLInputElement;
  let spotifyResponse: SpotifySearchRes;
  let appleMusicResponse: MusicKitSearchResponse;

  const search = async (
    query: string,
    types: ('artist' | 'track' | 'playlist' | 'album')[]
  ) => {
    if (!query) return;
    searching = true;
    input.blur();
    if ($user.musicPlatform === MusicPlatform.spotify) {
      const res = await fetch(getFirebaseUrl('searchspotify'), {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          query,
          types,
        }),
        headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
      });

      const json = await handleApiResponse(res);
      if (!json) {
        // handle login failure
        return false;
      }
      spotifyResponse = json.message as SpotifySearchRes;
    } else if ($user.musicPlatform === MusicPlatform.appleMusic) {
      const res = await fetch(getFirebaseUrl('searchapplemusic'), {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          query,
          types,
        }),
        headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
      });

      const json = await handleApiResponse(res);
      if (!json) {
        // handle login failure
        return false;
      }
      appleMusicResponse = json.message as MusicKitSearchResponse;
    }
    searching = false;
  };

  const setFavoriteTrackSpotify = async (item: SpotifyTrack) => {
    loading.set(true);
    const profile = $user.profile || ({} as User['profile']);
    if (!profile?.favorites) profile.favorites = {};
    profile.favorites.song = {
      name: item.name,
      artwork: item.album.images[0]?.url,
      artist: item.artists[0]?.name,
      url: item.external_urls.spotify,
    };
    await setProfile(profile);
    loading.set(false);
    goto('/private_profile');
  };

  const setFavoriteTrackAppleMusic = async (
    item: MusicKitSearchResponse['results']['songs']['data'][number]
  ) => {
    loading.set(true);
    const profile = $user.profile || ({} as User['profile']);
    if (!profile?.favorites) profile.favorites = {};
    profile.favorites.song = {
      name: item.attributes?.name,
      artwork: item.attributes?.artwork?.url
        .replace('{w}', '120')
        .replace('{h}', '120'),
      artist: item.attributes?.artistName,
      url: item.attributes?.url,
    };
    await setProfile(profile);
    loading.set(false);
    goto('/private_profile');
  };

  const setFavoriteAlbumSpotify = async (item: SpotifyAlbum) => {
    loading.set(true);
    const profile = $user.profile || ({} as User['profile']);
    if (!profile?.favorites) profile.favorites = {};
    profile.favorites.album = {
      name: item.name,
      artwork: item.images[0]?.url,
      artist: item.artists[0]?.name,
      url: item.external_urls.spotify,
    };
    await setProfile(profile);
    loading.set(false);
    goto('/private_profile');
  };

  const setFavoriteAlbumAppleMusic = async (
    item: MusicKitSearchResponse['results']['albums']['data'][number]
  ) => {
    loading.set(true);
    const profile = $user.profile || ({} as User['profile']);
    if (!profile?.favorites) profile.favorites = {};
    profile.favorites.album = {
      name: item.attributes?.name,
      artwork: item.attributes?.artwork?.url
        .replace('{w}', '120')
        .replace('{h}', '120'),
      artist: item.attributes?.artistName,
      url: item.attributes?.url,
    };
    await setProfile(profile);
    loading.set(false);
    goto('/private_profile');
  };

  const setFavoriteArtistSpotify = async (item: SpotifyArtist) => {
    loading.set(true);
    const profile = $user.profile || ({} as User['profile']);
    if (!profile?.favorites) profile.favorites = {};
    profile.favorites.artist = {
      name: item.name,
      artwork: item.images[0]?.url,
      url: item.external_urls.spotify,
    };
    await setProfile(profile);
    loading.set(false);
    goto('/private_profile');
  };

  const setFavoriteArtistAppleMusic = async (
    item: MusicKitSearchResponse['results']['artists']['data'][number]
  ) => {
    loading.set(true);
    const profile = $user.profile || ({} as User['profile']);
    if (!profile?.favorites) profile.favorites = {};
    profile.favorites.artist = {
      name: item.attributes?.name,
      artwork: item.attributes?.artwork?.url
        .replace('{w}', '120')
        .replace('{h}', '120'),
      url: item.attributes?.url,
    };
    await setProfile(profile);
    loading.set(false);
    goto('/private_profile');
  };
</script>

<div class="bg-gray-900">
  <div class="sticky top-0 w-full mx-auto py-2">
    <div
      class="w-full flex border-b-white border-b-2 flex-row justify-between items-center h-[55px] px-2"
    >
      <button class="flex-grow-0 text-transparent w-8 h-8 p-1"></button>
      <h1 class="text-center pt-2 mx-auto text-2xl text-white flex-grow">
        {$searchType} search
      </h1>
      <button
        on:click={() => goto('/private_profile')}
        class="flex-grow-0 text-transparent"
        ><svg
          fill="none"
          class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-${getPlatformColor(
            $user.musicPlatform
          )}`}
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
    </div>
    <div class="px-2">
      <div
        class="w-full flex rounded-md my-2 py-1 shadow-md bg-gray-700 text-white"
      >
        <div class="p-2 w-10/12 rounded-none">
          <input
            bind:value={query}
            bind:this={input}
            on:submit={() => search(query, [$searchType])}
            on:keyup={(e) => e.key === 'Enter' && search(query, [$searchType])}
            class="bg-gray-700 w-full placeholder:text-gray-400 rounded-md p-1 outline-none"
            placeholder="tap to search"
          />
        </div>
        {#if !searching}
          <svg
            on:click={() => search(query, [$searchType])}
            class="p-1 h-9 w-9 mx-auto bg-blue-600 mt-1 rounded-lg"
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
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            ></path>
          </svg>
        {:else}
          <LoadingIndicator
            className={'p-1 h-9 w-9 mx-auto mt-1 rounded-lg '}
          />
        {/if}
      </div>
      <div class="ml-1 text-sm flex text-gray-600">
        powered by
        {#if $user.musicPlatform === MusicPlatform.spotify}
          <img alt="spotify logo" class="ml-1 mt-1 h-3" src={SpotifyLogo} />
        {:else}
          <img
            alt="apple music logo"
            class="ml-1 mt-1 h-3"
            src={AppleMusicLogo}
          />
        {/if}
      </div>
    </div>
    <div class="overflow-y-scroll" style={`height: calc(100vh - ${130}px)`}>
      {#if spotifyResponse?.tracks?.items}
        {#each spotifyResponse.tracks.items as track, i}
          <div
            on:keypress={() => setFavoriteTrackSpotify(track)}
            on:click={() => setFavoriteTrackSpotify(track)}
            class={`flex p-2  ${
              i % 2
                ? 'bg-gray-900 hover:text-blue-500'
                : 'bg-gray-700 hover:text-blue-500'
            }`}
          >
            <img
              src={track.album.images[0]?.url}
              alt={track.name}
              class="w-10 h-10 self-center"
            />
            <p class="pl-2 pt-2 w-9/12">
              {track.name} - {track.artists[0]?.name}
            </p>
          </div>
        {/each}
      {:else if appleMusicResponse?.results?.songs?.data}
        {#each appleMusicResponse.results.songs?.data as songs, i}
          <div
            on:keypress={() => setFavoriteTrackAppleMusic(songs)}
            on:click={() => setFavoriteTrackAppleMusic(songs)}
            class={`flex p-2  ${
              i % 2
                ? 'bg-gray-900 hover:text-blue-500'
                : 'bg-gray-700 hover:text-blue-500'
            }`}
          >
            <img
              src={songs.attributes?.artwork?.url
                ?.replace('{w}', '120')
                .replace('{h}', '120')}
              alt={songs.attributes?.name}
              class="w-10 h-10 self-center"
            />
            <p class="pl-2 pt-2 w-9/12">
              {songs.attributes?.name} - {songs.attributes?.artistName}
            </p>
          </div>
        {/each}
      {/if}
      {#if spotifyResponse?.albums?.items}
        {#each spotifyResponse.albums.items as album, i}
          <div
            on:keypress={() => setFavoriteAlbumSpotify(album)}
            on:click={() => setFavoriteAlbumSpotify(album)}
            class={`flex p-2  ${
              i % 2
                ? 'bg-gray-900 hover:text-blue-500'
                : 'bg-gray-700 hover:text-blue-500'
            }`}
          >
            <img
              src={album.images[0]?.url}
              alt={album.name}
              class="w-10 h-10 self-center"
            />
            <p class={`pl-2 pt-2 `}>
              {album.name} - {album.artists[0]?.name}
            </p>
          </div>
        {/each}
      {:else if appleMusicResponse?.results?.albums?.data}
        {#each appleMusicResponse?.results.albums?.data as album, i}
          <div
            on:keypress={() => setFavoriteAlbumAppleMusic(album)}
            on:click={() => setFavoriteAlbumAppleMusic(album)}
            class={`flex p-2  ${
              i % 2
                ? 'bg-gray-900 hover:text-blue-500'
                : 'bg-gray-700 hover:text-blue-500'
            }`}
          >
            <img
              src={album.attributes?.artwork?.url
                .replace('{w}', '120')
                .replace('{h}', '120')}
              alt={album.attributes?.name}
              class="w-10 h-10 self-center"
            />
            <p class={`pl-2 pt-2 `}>
              {album.attributes?.name} - {album.attributes?.artistName}
            </p>
          </div>
        {/each}
      {/if}
      {#if spotifyResponse?.artists?.items}
        {#each spotifyResponse.artists.items as artist, i}
          <div
            on:keypress={() => setFavoriteArtistSpotify(artist)}
            on:click={() => setFavoriteArtistSpotify(artist)}
            class={`flex p-2  ${
              i % 2
                ? 'bg-gray-900 hover:text-blue-500'
                : 'bg-gray-700 hover:text-blue-500'
            }`}
          >
            <img
              src={artist.images[0]?.url}
              alt={artist.name}
              class="w-10 h-10 rounded-full"
            />
            <p class={`pl-2 pt-2 `}>
              {artist.name}
            </p>
          </div>
        {/each}
      {:else if appleMusicResponse?.results?.artists?.data}
        {#each appleMusicResponse.results?.artists?.data as artist, i}
          <div
            on:keypress={() => setFavoriteArtistAppleMusic(artist)}
            on:click={() => setFavoriteArtistAppleMusic(artist)}
            class={`flex p-2  ${
              i % 2
                ? 'bg-gray-900 hover:text-blue-500'
                : 'bg-gray-700 hover:text-blue-500'
            }`}
          >
            <img
              src={artist.attributes?.artwork?.url
                .replace('{w}', '120')
                .replace('{h}', '120')}
              alt={artist.attributes?.name}
              class="w-10 h-10 rounded-full"
            />
            <p class={`pl-2 pt-2 `}>
              {artist.attributes?.name}
            </p>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
