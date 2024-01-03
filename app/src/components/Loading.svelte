<script lang="ts">
  import { onMount } from 'svelte';

  let message = 0;
  onMount(async () => {
    setInterval(() => (message = Math.floor(Math.random() * 5)), 1500);
  });
</script>

<div class="z-50 fixed top-0 left-0 backdrop-blur-md w-full h-full flex">
  <div class="self-center mx-auto items-center justify-center">
    <svg
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      class="h-24 w-24 animate-spin mx-auto"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
    <div class="text-gray-300 mt-1 text-center flex items-center">
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
  </div>
</div>
