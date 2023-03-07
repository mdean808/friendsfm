<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../components/Button.svelte';
  import { shareAudial } from '../store';
  import { Clipboard, type ReadResult } from '@capacitor/clipboard';
  import { goto } from '../lib';
  import TextArea from '../components/TextArea.svelte';
  let scoreInput = '';
  let clipboard: ReadResult;
  let res: undefined | { score: string; number: number };

  onMount(async () => {
    clipboard = await Clipboard.read();
    res = getAudialScore();
  });

  const getAudialScore = () => {
    /* 
      audial #328
      ⬜ ⬜ ⬜ ⬜ ⬜ ⬜ 
      https://audial.mogdan.xyz/ 
    */
    const split = clipboard?.value.split('\n');
    if (split && split[0] && split[0]?.startsWith('audial #')) {
      return { score: split[1], number: parseInt(split[0].split('#')[1]) };
    } else {
      return;
    }
  };
</script>

<main class="z-40 text-center mx-auto w-full">
  <div
    class="absolute right-3 top-3"
    on:keydown={() => goto('/')}
    on:click={() => goto('/')}
  >
    <svg
      fill="none"
      class="h-8 w-8"
      stroke="currentColor"
      stroke-width="1.5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </div>
  <div class="mx-auto py-6 px-4 w-full mt-8">
    <h1 class="text-4xl">share audial score</h1>
    {#if !res}
      <p class=" text-gray-400 mt-10">
        we could not find an audial score on your clipboard
      </p>
      <p class=" text-gray-400">please paste one below</p>
      <div class="mt-5">
        <TextArea
          placeholder=""
          name="username"
          bind:value={scoreInput}
          className="text-center h-24"
        />
      </div>
      <div class="w-full mt-8">
        <Button
          type="submit"
          className={`${
            scoreInput ? '' : 'bg-gray-600 hover:bg-gray-600 cursor-default'
          } mx-auto px-6`}
          title="share audial"
          on:click={scoreInput ? () => shareAudial(scoreInput) : () => {}}
          >share</Button
        >
      </div>
    {:else}
      <p class="text-gray-400 mt-5">we found the following score</p>
      <h3 class="text-1xl">audial #{res?.number}</h3>
      <h3 class="text-2xl">{res?.score}</h3>
      <p class="text-gray-400 mt-10">share it?</p>
      <Button
        type="submit"
        className={`mx-auto px-6`}
        title="Share audial"
        on:click={() => shareAudial(res)}>share</Button
      >
    {/if}
  </div>
</main>
