<script lang="ts">
  import { MarkerClusterer } from '@googlemaps/markerclusterer';
  import { hashCode, intToRGB, showToast } from '$lib/util';
  import type { SavedSong, StrippedSubmission } from '$lib/types';
  import MusicPlatformIcon from '$components/icons/MusicPlatformIcon.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { activeSubmission, nearbySubmissions } from '$lib/submission';
  import { insets, location, updateCurrentLocation } from '$lib/device';
  import LoadingIndicator from '$components/LoadingIndicator.svelte';
  import { toggleSavedSong } from '$lib/songs';
  import { sendFriendRequest } from '$lib/friends';
  import { getNearbySubmissions } from '$lib/nearby';
  import { session } from '$lib/session';

  let map: google.maps.Map;
  let parentDiv: HTMLDivElement;
  let markers: google.maps.marker.AdvancedMarkerElement[] = [];

  let prevZoom = 12;
  let prevBounds: google.maps.LatLngBounds;

  let genres: { name: string; active: boolean }[] = [];

  let loadingNearby = false;

  nearbySubmissions.subscribe((val) => {
    genres = [];
    for (const sub of val) {
      const genre = sub.song.genre;
      if (!genres.find((g) => g.name === genre))
        genres.push({ name: genre, active: true });
    }
  });

  // lsiten for location changes
  location.subscribe((val) => {
    if (val?.coords && map && !$activeSubmission) {
      const startingCenter = {
        lng: $location?.coords?.longitude || 0,
        lat: $location?.coords?.latitude || 0,
      };
      map.setCenter(startingCenter);
      map.setZoom(12);
      createMarkers();
    }
  });

  onMount(async () => {
    // load genres
    genres = [];
    for (const sub of $nearbySubmissions) {
      const genre = sub.song.genre;
      if (!genres.find((g) => g.name === genre))
        genres.push({ name: genre, active: true });
    }

    const mapRef = document.getElementById('google-map')!;
    const { Map } = (await google.maps.importLibrary(
      'maps'
    )) as google.maps.MapsLibrary;

    // center on the genre that was tapped
    await updateCurrentLocation();
    let startingCenter = {} as { lat: number; lng: number };
    if ($activeSubmission?.location) {
      startingCenter = {
        lat: $activeSubmission.location?.latitude,
        lng: $activeSubmission.location?.longitude,
      };
    } else if ($location?.coords?.latitude && $location?.coords?.longitude) {
      // if coords aren't 0, 0
      startingCenter = {
        lng: $location?.coords?.longitude,
        lat: $location?.coords?.latitude,
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
    // update nearbySubmissions for this location
    setTimeout(() => {
      loadingNearby = true;
      handleBoundsChange();
    }, 100);

    // change radius based on the visibleWdith
    map.addListener('bounds_changed', async () => {
      if (prevZoom != map.getZoom()) {
        loadingNearby = true;
        handleBoundsChange();
      }
    });
    map.addListener('center_changed', async () => {
      loadingNearby = true;
      handleBoundsChange();
    });
    createMarkers();
  });

  onDestroy(() => {
    $activeSubmission = null;
  });

  let boundsChangeTimeout: NodeJS.Timeout | null = null;

  function handleBoundsChange() {
    if (boundsChangeTimeout !== null) {
      clearTimeout(boundsChangeTimeout);
    }

    boundsChangeTimeout = setTimeout(() => {
      let bounds = map.getBounds();
      let shouldGetSubmissions = true;
      // compare previous bounds to current bounds
      // make sure they are different enough to justify an update
      // first check for zoom change
      // then check for difference of .25 lng and lat
      if (!bounds) {
        map.setCenter({
          lat: $location?.coords?.latitude || 51.4934,
          lng: $location?.coords?.longitude || 0.0098,
        });
        bounds = map.getBounds();
      }
      if (
        bounds &&
        (Math.abs(bounds.getCenter().lat() - prevBounds?.getCenter().lat()) >
          0.25 ||
          Math.abs(bounds.getCenter().lng() - prevBounds?.getCenter().lng()) >
            0.25 ||
          $nearbySubmissions.length == 0)
      )
        shouldGetSubmissions = true;
      if (shouldGetSubmissions) {
        // update nearbySubmissions for this location
        loadingNearby = true;
        getNearbySubmissions(undefined, {
          southWest: {
            latitude: bounds?.getSouthWest().lat() || 0,
            longitude: bounds?.getSouthWest().lng() || 0,
          },
          northEast: {
            latitude: bounds?.getNorthEast().lat() || 0,
            longitude: bounds?.getNorthEast().lng() || 0,
          },
        }).then(() => {
          loadingNearby = false;
          createMarkers();
        });
        prevZoom = map.getZoom()!;
        prevBounds = map.getBounds()!;
      } else loadingNearby = false;
    }, 1000); // Adjust debounce time as needed
  }

  const createMarkers = async () => {
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;
    const missingSubs = [...$nearbySubmissions].filter((s) => {
      const hasLat = !!markers.find(
        (m) => m.position?.lat === s.location?.latitude
      );
      const hasLng = !!markers.find(
        (m) => m.position?.lng === s.location?.longitude
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
      markerDiv.textContent = sub.song.genre;
      const marker = new AdvancedMarkerElement({
        map,
        position: {
          lat: sub.location?.latitude,
          lng: sub.location?.longitude,
        },
        content: markerDiv,
      });
      return marker;
    });
    new MarkerClusterer({ markers, map, algorithmOptions: { maxZoom: 9 } });
  };

  const toggleSongHelper = async (
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
    await toggleSavedSong(savedSong);
    loadingHeart = false;
  };

  const gotoCoords = (lat: number, lng: number) => {
    if (map) {
      map.setZoom(10);
      map.setCenter({ lat, lng });
    }
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
  <div class={`w-full mx-auto py-2`}>
    <div
      class={`px-1.5 py-0.25 transition-all duration-200 rounded-lg ${
        loadingNearby
          ? `bg-gradient-to-r from-${$session.user.public.musicPlatform} via-blue-500 to-${$session.user.public.musicPlatform} background-animate`
          : 'bg-blue-500'
      }`}
    >
      <capacitor-google-map
        id="google-map"
        class="inline-block w-full h-56 mt-2 rounded-lg outline:boder-none focus:border-none"
      >
        <div
          class="flex flex-col items-center justify-items-center text-center h-full w-full"
        >
          <p class="mx-auto animate-pulse">loading map...</p>
          <p class="mx-auto text-gray-400">
            if the map doesn't load, make sure you have location services
            enabled
          </p>
          <p class="mx-auto text-gray-400">and your adblocker is disabled.</p>
        </div>
      </capacitor-google-map>
    </div>
  </div>
  <div
    style={`height: calc(100vh - ${400 - $insets.bottom}px);`}
    class="mx-auto w-full h-full text-center pt-2 pb-[200px] px-2 overflow-y-scroll"
  >
    {#each genres as genre}
      <div
        on:click={() => (genre.active = !genre.active)}
        on:keypress={() => (genre.active = !genre.active)}
        role="button"
        tabindex="0"
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
                  gotoCoords(sub.location?.latitude, sub.location?.longitude);
                  parentDiv.scrollIntoView();
                }}
                on:keyup={() => {
                  gotoCoords(sub.location?.latitude, sub.location?.longitude);
                  parentDiv.scrollIntoView();
                }}
                role="button"
                tabindex="0"
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
                  {#if !$session.user.friends.find((f) => f.username === sub.user.username) && sub.user.username !== $session.user.public.username}
                    {@const loadingFr = false}

                    {#if !loadingFr}
                      <button
                        on:click={(e) => {
                          e.stopPropagation();
                          requestFriend(sub.user.username, loadingFr);
                        }}
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
                      on:click={() => toggleSongHelper(sub, loadingHeart)}
                      on:keypress={() => toggleSongHelper(sub, loadingHeart)}
                      role="button"
                      tabindex="0"
                      class={`w-6 h-6 ml-auto flex-grow-0 flex-shrink ${
                        loadingHeart ? 'animate-ping text-white' : ''
                      } ${
                        $session.songs.find((s) => s.name === sub.song.name)
                          ? 'text-white'
                          : ''
                      } `}
                      fill={$session.songs.find((s) => s.name === sub.song.name)
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
