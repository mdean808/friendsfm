<script lang="ts">
  import { daysBetweenDates } from '$lib/util';
  import Button from '$components/Button.svelte';
  import { page } from '$app/stores';
  import { audialAnswer, audialAttempt } from '$lib/audial';
  import { Share } from '@capacitor/share';
  import { friendSubmissions } from '$lib/submission';
  import type { AudialAttempt } from '$lib/types/audial';
  import { insets } from '$lib/device';

  export let gameHeight: number;
  let notifyClipboard = false;
  let scoreHeight: number;
  const FIRST_DAY = new Date('4/12/2022');

  const generateEmojis = (attempt?: AudialAttempt) => {
    let emojiString = '';
    for (const guess of attempt?.guesses || $audialAttempt.guesses || []) {
      if (guess.correct) emojiString += '🟩 ';
      else if (guess.artistCorrect) emojiString += '🟨 ';
      else if (!guess.song) emojiString += '⬜ ';
      else emojiString += '🟥 ';
    }
    for (
      let i = 0;
      i < 6 - (attempt?.attempts || $audialAttempt.attempts);
      i++
    ) {
      emojiString += '⬛ ';
    }
    return emojiString;
  };

  const generateShareClipboard = async () => {
    let string = 'audial #' + daysBetweenDates(new Date(), FIRST_DAY);
    string += '\n' + generateEmojis();
    if (await Share.canShare()) {
      await Share.share({ url: 'https://audial.mogdan.xyz', text: string });
    } else {
      string += '\n' + $page.url.toString();
      navigator.clipboard.writeText(string);
      notifyClipboard = true;
    }
  };
</script>

<div class="mt-1">
  <div bind:clientHeight={scoreHeight}>
    {#if !$audialAttempt.correct}
      <div
        title="Open in Spotify"
        role="button"
        tabindex="0"
        on:keypress={() => {
          window.location.href = `https://open.spotify.com/track/${$audialAnswer.id}`;
        }}
        on:click={() => {
          window.location.href = `https://open.spotify.com/track/${$audialAnswer.id}`;
        }}
        class={`cursor-pointer border-blue-600 border-2 h-10 p-2 my-2 w-full text-left rounded-sm bg-gray-900 overflow-ellipsis whitespace-nowrap overflow-hidden`}
      >
        {$audialAnswer.name} by {$audialAnswer.artists[0].name}
      </div>
    {/if}
    <p class="mt-2 mb-1 text-center">
      audial #{daysBetweenDates(new Date(), FIRST_DAY)}
    </p>
    <p class="text-center">{generateEmojis()}</p>
    <div class="w-full mx-auto my-2">
      <Button
        title="Share Score"
        className="block mx-auto"
        type="submit"
        on:click={generateShareClipboard}
      >
        share
      </Button>
    </div>
  </div>
  <!-- LEADERBOARD -->
  <h2 class="text-xl text-center">friends</h2>
  <div class="py-2 px-6">
    <div class="flex w-full text-gray-400 border-b border-gray-300 space-x-4">
      <div class="w-1/2">user</div>
      <div class="w-1/2">score</div>
    </div>
    <div
      class="overflow-y-auto"
      style={`height: calc(100dvh - ${64 + 70 + $insets.bottom + $insets.top + gameHeight + 155}px)`}
    >
      {#each $friendSubmissions.filter((s) => s.audial?.guesses?.length === 6) as userSub}
        <div class="flex space-x-4 pt-2">
          <div class="w-1/2 truncate">
            {userSub.user.username}
          </div>
          <div class="w-1/2">{generateEmojis(userSub.audial)}</div>
        </div>
      {/each}
    </div>
  </div>
</div>
