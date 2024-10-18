<script lang="ts">
  import { daysBetweenDates } from '$lib/util';
  import Button from '$components/Button.svelte';
  import { page } from '$app/stores';
  import { audialAnswer, audialAttempt } from '$lib/audial';

  let notifyClipboard = false;
  const FIRST_DAY = new Date('4/12/2022');

  const generateEmojis = () => {
    let emojiString = '';
    for (const guess of $audialAttempt.guesses || []) {
      if (guess.correct) emojiString += '🟩 ';
      else if (guess.artistCorrect) emojiString += '🟨 ';
      else if (!guess.song) emojiString += '⬜ ';
      else emojiString += '🟥 ';
    }
    for (let i = 0; i < 6 - $audialAttempt.attempts; i++) {
      emojiString += '⬛ ';
    }
    return emojiString;
  };

  const generateShareClipboard = () => {
    let string = 'audial #' + daysBetweenDates(new Date(), FIRST_DAY);
    string += '\n' + generateEmojis();
    string += '\n' + $page.url.toString();
    navigator.clipboard.writeText(string);
    notifyClipboard = true;
  };
</script>

<div class="py-3">
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
  <span class="my-2">audial #{daysBetweenDates(new Date(), FIRST_DAY)}</span>
  <span> {generateEmojis()}</span>
  <div class="w-full mx-auto my-2">
    <Button
      title="Share Score"
      className="block mx-auto"
      type="submit"
      on:click={generateShareClipboard}
    >
      share
    </Button>
    <p
      class={`${
        notifyClipboard ? 'opacity-100' : 'opacity-0'
      } text-blue-100 font-semibold transition-all duration-500 my-2`}
    >
      copied to clipboard.
    </p>
  </div>
</div>
