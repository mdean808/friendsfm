<script lang="ts">
  import { getFirebaseUrl, goto, handleApiResponse } from '../lib';
  import {
    appCheckToken,
    authToken,
    loading,
    searchType,
    setProfile,
    user,
  } from '../store';
  import type {
    SpotifyAlbum,
    SpotifyArtist,
    SpotifySearchRes,
    SpotifyTrack,
  } from '../types';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';

  let query: string;
  let searching = false;
  let input: HTMLInputElement;
  let response: SpotifySearchRes;

  const search = async (
    query: string,
    types: ('artist' | 'track' | 'playlist' | 'album')[]
  ) => {
    if (!query) return;
    searching = true;
    input.blur();
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
    response = json.message as SpotifySearchRes;
    console.log(response);
    searching = false;
  };

  const setFavoriteTrack = async (item: SpotifyTrack) => {
    loading.set(true);
    const profile = $user.profile;
    if (!profile.favorites) profile.favorites = {};
    profile.favorites.song = {
      name: item.name,
      artwork: item.album.images[0]?.url,
      artist: item.artists[0]?.name,
      url: item.external_urls.spotify,
    };
    await setProfile(profile);
    loading.set(false);
    goto('/profile');
  };

  const setFavoriteAlbum = async (item: SpotifyAlbum) => {
    loading.set(true);
    const profile = $user.profile;
    if (!profile.favorites) profile.favorites = {};
    profile.favorites.album = {
      name: item.name,
      artwork: item.images[0]?.url,
      artist: item.artists[0]?.name,
      url: item.external_urls.spotify,
    };
    await setProfile(profile);
    loading.set(false);
    goto('/profile');
  };

  const setFavoriteArtist = async (item: SpotifyArtist) => {
    loading.set(true);
    const profile = $user.profile;
    if (!profile.favorites) profile.favorites = {};
    profile.favorites.artist = {
      name: item.name,
      artwork: item.images[0]?.url,
      url: item.external_urls.spotify,
    };
    await setProfile(profile);
    loading.set(false);
    goto('/profile');
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
        on:click={() => goto('/profile')}
        class="flex-grow-0 text-transparent"
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
    </div>
    <div class="overflow-y-scroll" style={`height: calc(100vh - ${130}px)`}>
      {#if response?.tracks?.items}
        {#each response.tracks.items as track, i}
          <div
            on:keypress={() => setFavoriteTrack(track)}
            on:click={() => setFavoriteTrack(track)}
            class={`flex p-2  ${
              i % 2
                ? 'bg-gray-900 hover:text-blue-500'
                : 'bg-gray-700 hover:text-blue-500'
            }`}
          >
            <img
              src={track.album.images[0]?.url}
              alt={track.name}
              class="w-10 h-10 rounded-md self-center"
            />
            <p class="pl-2 pt-2 w-9/12">
              {track.name} - {track.artists[0]?.name}
            </p>
          </div>
        {/each}
      {/if}
      {#if response?.albums?.items}
        {#each response.albums.items as album, i}
          <div
            on:keypress={() => setFavoriteAlbum(album)}
            on:click={() => setFavoriteAlbum(album)}
            class={`flex p-2  ${
              i % 2
                ? 'bg-gray-900 hover:text-blue-500'
                : 'bg-gray-700 hover:text-blue-500'
            }`}
          >
            <img
              src={album.images[0]?.url}
              alt={album.name}
              class="w-10 h-10 rounded-md self-center"
            />
            <p class={`pl-2 pt-2 `}>
              {album.name} - {album.artists[0]?.name}
            </p>
          </div>
        {/each}
      {/if}
      {#if response?.artists?.items}
        {#each response.artists.items as artist, i}
          <div
            on:keypress={() => setFavoriteArtist(artist)}
            on:click={() => setFavoriteArtist(artist)}
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
      {/if}
    </div>
  </div>
</div>
