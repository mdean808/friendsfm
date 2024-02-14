<script lang="ts">
  import { MarkerClusterer } from '@googlemaps/markerclusterer';
  import { hashCode, intToRGB, showToast } from '../lib/util';
  import type { SavedSong, StrippedSubmission } from '../types';
  import {
    toggleSong,
    activeGenre,
    nearbySubmissions,
    songs,
    location,
    updateCurrentLocation,
    insets,
    getNearbySubmissions,
    sendFriendRequest,
    user,
  } from '../store';
  import MusicPlatformIcon from '../components/icons/MusicPlatformIcon.svelte';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import LoadingIndicator from './LoadingIndicator.svelte';

  let map: google.maps.Map;
  let parentDiv: HTMLDivElement;
  let markers: google.maps.marker.AdvancedMarkerElement[] = [];

  let prevZoom = 12;

  activeGenre.listen((val) => {
    const genreSub = $nearbySubmissions.find((s) => s.song.genre === val);
    gotoCoords(genreSub.location.latitude, genreSub.location.longitude);
  });

  let genres: { name: string; active: boolean }[] = [];

  nearbySubmissions.subscribe((val) => {
    genres = [];
    for (const sub of val) {
      const genre = sub.song.genre;
      genres.push({ name: genre, active: true });
    }
  });

  onMount(async () => {
    for (const sub of $nearbySubmissions) {
      const genre = sub.song.genre;
      if (!genres.find((g) => g.name === genre))
        genres.push({ name: genre, active: true });
    }
    await updateCurrentLocation();
    const mapRef = document.getElementById('google-map');
    const { Map } = (await google.maps.importLibrary(
      'maps'
    )) as google.maps.MapsLibrary;

    // center on the genre that was tapped
    let startingCenter = {} as { lat: number; lng: number };
    if ($location?.gp?.coords) {
      startingCenter = {
        lng: $location?.gp?.coords.longitude,
        lat: $location?.gp?.coords.latitude,
      };
    } else {
      startingCenter = { lng: 0, lat: 0 };
      prevZoom = 1;
    }

    map = new Map(mapRef, {
      mapId: '8cf3f704a1cf499b',
      center: startingCenter,
      zoom: prevZoom,
      disableDefaultUI: true,
      zoomControl: false,
    });

    // change radius based on the visibleWdith
    map.addListener('bounds_changed', async () => {
      if (prevZoom != map.getZoom() && map.getZoom() < 15) {
        const bounds = map.getBounds();
        await getNearbySubmissions(null, {
          southWest: {
            latitude: bounds.getSouthWest().lat(),
            longitude: bounds.getSouthWest().lng(),
          },
          northEast: {
            latitude: bounds.getNorthEast().lat(),
            longitude: bounds.getNorthEast().lng(),
          },
        });
        createMarkers();
        prevZoom = map.getZoom();
      }
    });
    createMarkers();
  });

  const createMarkers = async () => {
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;
    const missingSubs = [...$nearbySubmissions].filter((s) => {
      const hasLat = !!markers.find(
        (m) => m.position.lat === s.location.latitude
      );
      const hasLng = !!markers.find(
        (m) => m.position.lng === s.location.longitude
      );
      if (hasLat && hasLng) return false;
      else return true;
    });
    markers = missingSubs.map((sub) => {
      const markerDiv = document.createElement('div');
      markerDiv.className = `p-2 text-white relative text-md rounded-lg`;
      markerDiv.setAttribute(
        'style',
        `background: ${intToRGB(hashCode(sub.song.genre, 23))}`
      );
      // markerDiv.textContent = sub.song.name + ' - ' + sub.song.artist;
      markerDiv.textContent = sub.song.genre;
      /*const arrow = document.createElement('span');
      arrow.setAttribute(
        'style',
        `border-top-color: ${intToRGB(hashCode(sub.song.genre, 23))}`
      );
      arrow.className = `-bottom-3 left-[42%] w-3 h-3 absolute 
                        border-l-[2px] border-l-transparent
                        border-t-[7px] 
                        border-r-[2px] border-r-transparent
                        `;
      markerDiv.appendChild(arrow);
      */
      const marker = new AdvancedMarkerElement({
        map,
        position: {
          lat: sub.location.latitude,
          lng: sub.location.longitude,
        },
        content: markerDiv,
      });
      return marker;
    });
    new MarkerClusterer({ markers, map, algorithmOptions: { maxZoom: 9 } });
  };

  const toggleHeart = async (
    data: StrippedSubmission,
    loadingHeart: boolean
  ) => {
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
    if (map) map.setCenter({ lat, lng });
  };

  const requestFriend = async (username: string, loading: boolean) => {
    loading = true;
    if (await sendFriendRequest(username)) {
      showToast({ content: 'Successfully sent friend request' });
    }
    loading = false;
  };
</script>

<div
  bind:this={parentDiv}
  class="scroll-m-20 scroll-smooth overflow-hidden"
  style={`height: calc(100vh - ${250 - $insets.bottom}px)`}
>
  <div class="w-full mx-auto p-2">
    <capacitor-google-map
      id="google-map"
      class="inline-block w-full h-56 mt-2 rounded-lg"
    >
      <div
        class="flex flex-col items-center justify-items-center text-center h-full w-full"
      >
        <p class="mx-auto animate-pulse">loading map...</p>
        <p class="mx-auto text-gray-400">
          if the map doesn't load, make sure you have location services enabled
        </p>
        <p class="mx-auto text-gray-400">and your adblocker is disabled.</p>
      </div>
    </capacitor-google-map>
  </div>
  <div
    style={`height: calc(100vh - ${400 - $insets.bottom}px);`}
    class="mx-auto w-full h-full text-center pt-2 pb-[200px] px-2 overflow-y-scroll"
  >
    {#each genres as genre}
      <div
        on:click={() => (genre.active = !genre.active)}
        on:keypress={() => (genre.active = !genre.active)}
        style={`border-color: ${intToRGB(hashCode(genre.name, 23))}`}
        class={`p-1 border-b-2 mb-2 flex w-full border-white`}
      >
        <div class="w-1/12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mr-auto w-6 h-6 -scale-x-100"
            fill={intToRGB(hashCode(genre.name, 23))}
            viewBox="0 0 256 256"
          >
            <path
              d="M80,96a8,8,0,0,1-8,8H24a8,8,0,0,1,0-16H72A8,8,0,0,1,80,96Zm-8,24H24a8,8,0,0,0,0,16H72a8,8,0,0,0,0-16Zm0,32H24a8,8,0,0,0,0,16H72a8,8,0,0,0,0-16Zm0,32H24a8,8,0,0,0,0,16H72a8,8,0,0,0,0-16Zm80-64H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Zm0,32H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Zm0,32H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Zm80-96H184a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16ZM184,72h48a8,8,0,0,0,0-16H184a8,8,0,0,0,0,16Zm48,48H184a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Zm0,32H184a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Zm0,32H184a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z"
            >
            </path>
          </svg>
        </div>
        <h1 class="text-lg text-white text-left w-10/12">
          {genre.name}
        </h1>
        <div class="w-1/12">
          <svg
            class={`w-6 h-6 ml-auto transition-all duration-150 ${
              genre.active ? 'rotate-0' : 'rotate-180'
            }`}
            style={`color: ${intToRGB(hashCode(genre.name, 23))}`}
            data-slot="icon"
            fill="none"
            stroke-width="1.5"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            ></path>
          </svg>
        </div>
      </div>
      {#each $nearbySubmissions.filter((s) => s.song.genre === genre.name) as sub}
        {#if genre.active}
          {@const loadingHeart = false}
          <div
            transition:slide
            class={`border-white rounded-lg shadow-lg bg-gray-700 mb-4`}
          >
            <div class="">
              <div
                on:click={() => {
                  gotoCoords(sub.location.latitude, sub.location.longitude);
                  parentDiv.scrollIntoView();
                }}
                on:keyup={() => this.click()}
                style={`background: ${intToRGB(hashCode(sub.song.genre, 23))}`}
                class={`flex p-2 rounded-t-lg bg-${sub.user.musicPlatform}`}
              >
                <div class="flex-grow text-left">
                  <h4 class="text-xl">
                    <span class={`text-white`}>
                      <MusicPlatformIcon
                        className="inline w-5 h-5"
                        id={sub.user ? sub.user.musicPlatform : 'spotify'}
                      />
                    </span>
                    <span class="text-lg">{sub.user.username}</span>
                  </h4>
                </div>
                <div
                  class="flex-grow-0 text-right flex flex-row flex-nowrap justify-between gap-2"
                >
                  {#if !$user.friends.find((f) => f.username === sub.user.username) && sub.user.username !== $user.username}
                    {@const loadingFr = false}

                    {#if !loadingFr}
                      <button
                        on:click={() =>
                          requestFriend(sub.user.username, loadingFr)}
                        class=" text-white"
                      >
                        <svg
                          class={`w-6 h-6 text-white`}
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
                    {:else}
                      <LoadingIndicator className="w-6 mx-auto" />
                    {/if}
                  {/if}
                  <div class="h-full">
                    <svg
                      on:click={() => toggleHeart(sub, loadingHeart)}
                      on:keypress={() => toggleHeart(sub, loadingHeart)}
                      class={`w-6 h-6 ml-auto flex-grow-0 flex-shrink ${
                        loadingHeart ? 'animate-ping text-white' : ''
                      } ${
                        $songs.find((s) => s.name === sub.song.name)
                          ? 'text-white'
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
                                hashCode(sub.song.genre, 23)
                              )}`}
                              class={`truncate text-${sub.user?.musicPlatform}`}
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
        {/if}
      {/each}
    {/each}
  </div>
</div>
