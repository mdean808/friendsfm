<script lang="ts">
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
  let loading = true;
  // save each change to the current attempt to the database
  audialAttempt.subscribe(async (val) => {
    // todo: prevent this from resetting when a uesr already has an attempt
    if (
      !$userSubmission ||
      !val ||
      val.attempts < $userSubmission.audial.attempts
    )
      return;
    console.log($userSubmission.audial.attempts, val.attempts);
    await setSubmissionAudial($userSubmission, val);
  });
  onMount(async () => {
    const { tracks, answer } = await getCurrentAudial();
    audialTracks.set(tracks);
    audialAnswer.set(answer);
    // load the current attempt from the current submission
    if ($userSubmission) audialAttempt.set($userSubmission.audial);
    loading = false;
  });
</script>

<div
  style={`height: calc(100vh - ${64 + $insets.bottom + $insets.top}px); padding-bottom: calc(70px + ${$insets.bottom}px)`}
  class="overflow-y-scroll relative"
>
  <div class="px-2">
    {#if loading}
      <LoadingIndicator className="w-10 h-10 mx-auto" />
    {:else}
      <div class="max-w-screen-md mx-auto">
        {#if $userSubmission}
          <AudialGame />
          <Controller />
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
