<script lang="ts">
  import Genres from '$components/Genres.svelte';
  import { userSubmission } from '$lib/submission';
  import { submissionLoaded } from '$lib/util';
</script>

{#if $userSubmission}
  <div id="map" class={`text-center w-full h-auto px-4 overflow-y-scroll`}>
    <div class="h-full">
      {#if $userSubmission}
        <div class="text-center w-full h-full">
          <Genres />
        </div>
      {/if}
    </div>
  </div>
{:else if $submissionLoaded && !$userSubmission}
  <div id="map" class={`text-center w-full h-auto px-4 overflow-y-scroll`}>
    <div class="h-full">
      <p class="text-center mt-4 mx-auto">
        please share what you're listening to before viewing the map.
      </p>
    </div>
  </div>
{/if}
