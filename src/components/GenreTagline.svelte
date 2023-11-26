<script lang="ts">
  import { onMount } from 'svelte';
  import { activeGenre, nearbySubmissions } from '../store';
  import { goto, intToRGB, hashCode } from '../lib';
  import type { StrippedSubmission } from '../types';

  let genreCounts: { count: number; name: string }[] = [];
  let uniqueGenres: string[] = [];
  let genres: string[] = [];
  let message = 0;
  export let loading = false;

  nearbySubmissions.listen((val) => {
    parseGenres(val);
  });

  onMount(async () => {
    setInterval(() => (message = Math.floor(Math.random() * 5)), 1500);
    parseGenres(nearbySubmissions.get());
  });

  const parseGenres = (storeValue: readonly StrippedSubmission[]) => {
    // handle data
    genres = [...storeValue.map((item) => item.song.genre)];
    uniqueGenres = [...new Set(genres)];
    genreCounts = uniqueGenres.map((genre) => {
      return {
        count: genres.filter((item) => item === genre)?.length,
        name: genre,
      };
    });
  };

  const getPosition = (name: string) => {
    const sorted = genreCounts.sort((a, b) => b.count - a.count);
    return sorted.findIndex((s) => s.name === name) + 1;
  };
</script>

<div class="h-[34px]">
  {#if !loading}
    <div class="overflow-x-auto scroll-hide">
      <div
        class="text-xs gap-2 inline-flex font-semibold
    leading-sm uppercase py-1 rounded-full"
      >
        {#if uniqueGenres?.length < 1}
          <div class="mt-2 text-gray-300 text-center">no nearby genres</div>
        {:else}
          {#each uniqueGenres.sort((a, b) => genreCounts.find((c) => c.name === b).count - genreCounts.find((c) => c.name === a).count) as genre}
            <div
              on:keyup={() => {
                activeGenre.set(genre);
                goto('/genres');
              }}
              on:click={() => {
                activeGenre.set(genre);
                goto('/genres');
              }}
              class="text-xs inline-flex items-center leading-sm
        uppercase px-3 py-1 rounded-full truncate"
              style={`background: ${intToRGB(hashCode(genre, 23))}; `}
            >
              <span class="mt-[2px]">{genre}</span>
            </div>
          {/each}
        {/if}
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
</div>
