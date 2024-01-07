<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../components/Button.svelte';
  import { shareAudial } from '../store';
  import { Clipboard, type ReadResult } from '@capacitor/clipboard';
  import { goto } from '../lib/util';
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

<main class="z-40 relative text-center mx-auto w-full">
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
    <br />
    <button
      on:click={() => goto('/')}
      class="underline text-blue-500 mt-10 text-center mx-auto">go back</button
    >
  </div>
</main>
