<script lang="ts">
  import GameEnd from '$components/audial/GameEnd.svelte';
  import LoadingIndicator from '$components/LoadingIndicator.svelte';
  import Controller from '$components/audial/Controller.svelte';
  import AudialGame from '$components/audial/Game.svelte';
  import {
    getCurrentAudial,
    audialTracks,
    audialAnswer,
    audialAttempt,
    setSubmissionAudial,
  } from '$lib/audial';
  import { insets } from '$lib/device';
  import { userSubmission } from '$lib/submission';
  import { onMount } from 'svelte';
  import type { AudialAttempt } from '$lib/types/audial';
  let loading = true;
  let gameHeight = 0;
  // save each change to the current attempt to the database
  audialAttempt.subscribe(async (val) => {
    if (!$userSubmission || !val || val.attempts !== -1) return;
    await setSubmissionAudial($userSubmission, val);
  });
  onMount(async () => {
    const { tracks, answer } = await getCurrentAudial();
    audialTracks.set(tracks);
    audialAnswer.set(answer);
    // load the current attempt from the current submission
    if ($userSubmission?.audial.type) audialAttempt.set($userSubmission.audial);
    else
      audialAttempt.set({
        attempts: -1,
        correct: false,
        guesses: [],
        type: 'default',
        date: new Date(),
      } as AudialAttempt);
    loading = false;
  });
</script>

<div
  style={`max-height: calc(100dvh - ${64 + 70 + $insets.bottom + $insets.top}px); height: calc(100dvh - ${64 + 70 + $insets.bottom + $insets.top}px);`}
  class="overflow-y-hidden relative"
>
  <div class="px-2">
    {#if loading}
      <LoadingIndicator className="w-10 h-10 mx-auto" />
    {:else}
      <div class="max-w-screen-md mx-auto">
        {#if $userSubmission}
          <div bind:clientHeight={gameHeight}>
            <AudialGame />
          </div>
          {#if !$audialAttempt.correct && $audialAttempt.guesses.length !== 6}
            <Controller />
          {:else}
            <GameEnd {gameHeight} />
          {/if}
        {:else}
          <p class="text-center mt-4">
            please share what you're listening to before playing.
          </p>
          <p class="text-center text-gray-400 text-sm">
            audial scores are tied to each day's submission
          </p>
        {/if}
      </div>
    {/if}
  </div>
</div>
