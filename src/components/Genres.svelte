<script lang="ts">
  import { onMount } from 'svelte';
  import {
    activeGenre,
    genrePane,
    getNearbySubmissions,
    nearbySubmissions,
  } from '../store';
  import { goto, intToRGB, hashCode } from '../lib';

  let genreCounts: { count: number; name: string }[] = [];
  let uniqueGenres: string[] = [];
  let genres: string[] = [];
  let message = 0;
  let loading = true;

  onMount(async () => {
    setInterval(() => (message = Math.floor(Math.random() * 5)), 1500);
    // handle data
    await getNearbySubmissions();
    genres = [...nearbySubmissions.get().map((item) => item.song.genre)];
    uniqueGenres = [...new Set(genres)];
    genreCounts = uniqueGenres.map((genre) => {
      return {
        count: genres.filter((item) => item === genre).length,
        name: genre,
      };
    });
    loading = false;
  });

  const getPosition = (name: string) => {
    const sorted = genreCounts.sort((a, b) => b.count - a.count);
    return sorted.findIndex((s) => s.name === name) + 1;
  };
</script>

{#if uniqueGenres.length > 0 && !loading}
  <div class="overflow-x-auto scroll-hide">
    <div
      class="text-xs gap-2 inline-flex font-semibold
    leading-sm uppercase py-1 rounded-full"
    >
      {#each uniqueGenres.sort((a, b) => genreCounts.find((c) => c.name === b).count - genreCounts.find((c) => c.name === a).count) as genre}
        <div
          on:keyup={() => {
            activeGenre.set(genre);
            goto('/genre');
            // $genrePane.present({ animate: true });
          }}
          on:click={() => {
            activeGenre.set(genre);
            goto('/genre');
            // $genrePane.present({ animate: true });
          }}
          class="text-xs inline-flex items-center leading-sm
        uppercase px-3 py-1 rounded-full truncate"
          style={`background: ${intToRGB(hashCode(genre, 23))}; `}
        >
          <span class="mt-[2px]">#{getPosition(genre)}: {genre}</span>
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="animate-pulse text-gray-300 text-center">
    {#if message === 0}
      <p>analyzing submissions</p>
    {:else if message === 1}
      <p>creating new genres</p>
    {:else if message === 2}
      <p>locating musical hotspots</p>
    {:else if message === 3}
      <p>asking chat-gpt for help</p>
    {:else if message === 4}
      <p>learning music theory</p>
    {/if}
  </div>
{/if}
