<script lang="ts">
  import { showToast } from '$lib/util';
  import type { Submission } from '$lib/types';
  import SubmissionSong from './Song.svelte';
  import SubmissionTime from './Time.svelte';
  import SubmissionActions from './Actions.svelte';
  import { Dialog } from '@capacitor/dialog';
  import { activeSubmission } from '$lib/submission';
  import { goto } from '$app/navigation';
  import { Capacitor } from '@capacitor/core';

  export let data: Submission;
  let tempCap = '';

  const showFullSubmission = () => {
    activeSubmission.set(data);
    goto('/modal/submission');
  };

  const createCaption = async () => {
    try {
      if (Capacitor.getPlatform() === 'web') {
        const res = prompt('Enter your caption below.');
        if (!res?.trim()) return;
        tempCap = res;
        ///todo: firestore function to set the caption
      } else {
        const res = await Dialog.prompt({
          title: 'Create Caption',
          message: 'Enter your caption below.',
        });
        if (res.cancelled || !res.value.trim()) return;
        tempCap = res.value;
        ///todo: firestore function to set the caption
      }
      showToast({ content: 'successfully updated your caption.' });
    } catch (e) {
      console.log(e);
    }
  };
</script>

<div class="rounded-b-lg mb-1 shadow-lg">
  <div
    on:keypress={showFullSubmission}
    on:click={showFullSubmission}
    role="button"
    tabindex="0"
    class={`border-white rounded-t-lg bg-gray-700 `}
  >
    <div class="relative">
      <!-- SONG DURATION BACKGROUND -->
      {#if data.song.timestamp === 0}
        <div
          style={`
      width: ${(data.song.durationElapsed / data.song.length) * 100}%
      `}
          class="absolute rounded-l-lg left-0 right-0 h-full bg-blue-700 opacity-60 z-0"
        />
      {/if}

      <!-- SONG -->
      <div class="sticky px-2 py-2">
        <div class="flex">
          <SubmissionTime className="w-7/10 text-left truncate" split {data} />
          <SubmissionActions
            className="ml-auto flex gap-2 w-3/10 flex-grow-0 flex-shrink"
            {data}
            user
          />
        </div>
        <SubmissionSong {data} />
      </div>
    </div>
  </div>

  <div class={`p-1 rounded-b-lg border-t italic border-gray-400 bg-gray-700`}>
    {#if data.caption || tempCap}
      <button on:click={createCaption} class="text-white italic w-full">
        {data.caption ? data.caption : tempCap}</button
      >
    {:else}
      <button
        on:click={createCaption}
        class="text-white underline italic w-full"
      >
        add a caption</button
      >
    {/if}
  </div>
</div>
