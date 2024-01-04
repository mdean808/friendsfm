<script lang="ts">
  import { MarkerClusterer } from '@googlemaps/markerclusterer';
  import { getPlatformColor, hashCode, intToRGB } from '../lib';
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
  } from '../store';
  import MusicPlatformIcon from '../components/icons/MusicPlatformIcon.svelte';
  import { onMount } from 'svelte';

  let map: google.maps.Map;
  let parentDiv: HTMLDivElement;
  let markers: google.maps.marker.AdvancedMarkerElement[] = [];

  let prevZoom = 12;

  activeGenre.listen((val) => {
    const genreSub = $nearbySubmissions.find((s) => s.song.genre === val);
    gotoCoords(genreSub.location.latitude, genreSub.location.longitude);
  });

  onMount(async () => {
    const genreSubmissions = [...$nearbySubmissions].filter(
      (sub) => sub.song.genre.toLowerCase() === $activeGenre.toLowerCase()
    );
    await updateCurrentLocation();
    const mapRef = document.getElementById('google-map');
    const { Map } = (await google.maps.importLibrary(
      'maps'
    )) as google.maps.MapsLibrary;

    // center on the genre that was tapped
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
    if (map) map.setCenter({ lat, lng });
  };
</script>

<div
  bind:this={parentDiv}
  class="scroll-m-20 scroll-smooth"
  style={`padding-bottom: calc(70px + ${$insets.bottom}px)`}
>
  <div class="sticky top-0 w-full mx-auto p-2">
    <capacitor-google-map
      id="google-map"
      class="inline-block w-full h-64 mt-2 rounded-lg"
      ><div
        class="flex items-center justify-items-center text-center h-full w-full animate-pulse"
      >
        <p class="mx-auto">loading map...</p>
        <p class="mx-auto">
          if the map doesn't load, make sure you your ad blocker disabled.
        </p>
      </div></capacitor-google-map
    >
  </div>
  <div class="mx-auto w-full h-full text-center py-2 px-2">
    <div class="overflow-y-auto" style="">
      <!--{#each [...$nearbySubmissions].filter((sub) => sub.song.genre.toLowerCase() === $activeGenre.toLowerCase()) as sub}-->
      {#each $nearbySubmissions as sub}
        <div class={`border-white rounded-lg shadow-lg bg-gray-700 mb-4`}>
          <div class="">
            <div
              on:click={() => {
                gotoCoords(sub.location.latitude, sub.location.longitude);
                parentDiv.scrollIntoView();
              }}
              on:keyup={() => this.click()}
              style={`background: ${intToRGB(hashCode(sub.song.genre, 23))}`}
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
                  <span class="text-lg">{sub.song.genre}</span>
                </h4>
              </div>
              <div class="flex-grow-0 text-right">
                <div class="h-full flex flex-col flex-nowrap justify-between">
                  <svg
                    on:click={() => toggleHeart(sub)}
                    on:keypress={() => toggleHeart(sub)}
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
