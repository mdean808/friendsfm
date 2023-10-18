<script lang="ts">
  import { getPlatformColor, goto, hashCode, intToRGB } from '../lib';
  import type { SavedSong, StrippedSubmission } from '../types';
  import {
    toggleSong,
    activeGenre,
    nearbySubmissions,
    songs,
    location,
    updateCurrentLocation,
    prevPath,
  } from '../store';
  import MusicPlatformIcon from '../components/MusicPlatformIcon.svelte';
  import { onMount } from 'svelte';

  let map: google.maps.Map;

  onMount(async () => {
    const genreSubmissions = [...$nearbySubmissions].filter(
      (sub) => sub.song.genre.toLowerCase() === $activeGenre.toLowerCase()
    );
    await updateCurrentLocation();
    const mapRef = document.getElementById('google-map');
    const { Map } = (await google.maps.importLibrary(
      'maps'
    )) as google.maps.MapsLibrary;
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;

    const startingCenter =
      genreSubmissions.length > 0
        ? {
            lng: genreSubmissions[0].location.longitude,
            lat: genreSubmissions[0].location.latitude,
          }
        : {
            lng: location.get().gp.coords.longitude,
            lat: location.get().gp.coords.latitude,
          };

    map = new Map(mapRef, {
      mapId: '8cf3f704a1cf499b',
      center: startingCenter,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
    });
    //todo: as the user zooms out of the map, request a wider raidus of submissions of said genre and add them as markers

    for (const sub of genreSubmissions) {
      const markerDiv = document.createElement('div');
      markerDiv.className = `p-2 text-white relative text-md rounded-lg`;
      markerDiv.setAttribute(
        'style',
        `background: ${intToRGB(hashCode($activeGenre, 23))}`
      );
      markerDiv.textContent = sub.song.name + ' - ' + sub.song.artist;
      const arrow = document.createElement('span');
      arrow.setAttribute(
        'style',
        `border-top-color: ${intToRGB(hashCode($activeGenre, 23))}`
      );
      arrow.className = `-bottom-3 left-[42%] w-3 h-3 absolute 
                        border-l-[5px] border-l-transparent
                        border-t-[7px] 
                        border-r-[5px] border-r-transparent
                        `;
      markerDiv.appendChild(arrow);
      new AdvancedMarkerElement({
        map,
        position: {
          lat: sub.location.latitude,
          lng: sub.location.longitude,
        },
        content: markerDiv,
      });
    }
  });

  let loadingHeart = false;
  const toggleHeart = async (data: StrippedSubmission) => {
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

  const gotoCoords = (lat: number, lng: number) => {
    map.setCenter({ lat, lng });
  };
</script>

<div class="bg-gray-900">
  <div class="sticky top-0 w-full mx-auto p-2">
    <div
      class="w-full flex border-b-white border-b-2 flex-row justify-between items-center h-[55px] px-2"
    >
      <button class="flex-grow-0 text-transparent w-8 h-8 p-1"></button>
      <h1 class="text-center pt-2 mx-auto text-2xl text-white flex-grow">
        {$activeGenre.toLowerCase()} submissions
      </h1>
      <button
        on:click={() => goto($prevPath)}
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
    <capacitor-google-map
      id="google-map"
      class="inline-block w-full h-64 mt-2 rounded-lg"
      ><div
        class="flex items-center justify-items-center text-center h-full w-full animate-pulse"
      >
        <span class="mx-auto">loading map...</span>
      </div></capacitor-google-map
    >
  </div>
  <div class="mx-auto w-full h-full text-center py-2 px-2">
    <div class="overflow-y-auto h-full">
      {#each [...$nearbySubmissions].filter((sub) => sub.song.genre.toLowerCase() === $activeGenre.toLowerCase()) as sub}
        <div class={`border-white rounded-lg shadow-lg bg-gray-700 mb-4`}>
          <div class="">
            <div
              on:click={() =>
                gotoCoords(sub.location.latitude, sub.location.longitude)}
              on:keyup={() => this.click()}
              style={`background: ${intToRGB(hashCode($activeGenre, 23))}`}
              class={`flex p-2 rounded-t-lg bg-${getPlatformColor(
                sub.user.musicPlatform
              )}`}
            >
              <div class="flex-grow text-left">
                <h4 class="text-xl">
                  <span class={`text-white`}
                    ><MusicPlatformIcon
                      className="inline w-5 h-5"
                      id={sub.user ? sub.user.musicPlatform : 'spotify'}
                    />
                  </span>
                </h4>
              </div>
              <div class="flex-grow-0 text-right">
                <div class="h-full flex flex-col flex-nowrap justify-between">
                  <svg
                    on:click={() => toggleHeart(sub)}
                    on:keypress={() => toggleHeart(sub)}
                    class={`w-6 h-6 ml-auto flex-grow-0 flex-shrink ${
                      loadingHeart ? 'animate-ping text-pink-500' : ''
                    } ${
                      $songs.find((s) => s.name === sub.song.name)
                        ? 'text-pink-500'
                        : ''
                    } `}
                    fill={$songs.find((s) => s.name === sub.song.name)
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
                </div>
              </div>
            </div>
            <div>
              <div>
                <div class="flex px-2 py-1">
                  <div class="flex-grow text-left">
                    <a href={sub.song.url}>
                      <div class="flex mb-1 mt-0.5">
                        {#if sub.song.albumArtwork}
                          <img
                            alt="Album Artwork"
                            class="w-12 h-12 mr-3"
                            src={sub.song.albumArtwork}
                          />
                        {/if}
                        <div class={sub.song.albumArtwork ? 'w-44' : 'w-72'}>
                          <p
                            style={`color: ${intToRGB(
                              hashCode($activeGenre, 23)
                            )}`}
                            class={`truncate text-${getPlatformColor(
                              sub.user?.musicPlatform
                            )}`}
                          >
                            {sub.song?.name}
                          </p>
                          <p class="truncate text-gray-100">
                            {sub.song?.artist}
                          </p>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
