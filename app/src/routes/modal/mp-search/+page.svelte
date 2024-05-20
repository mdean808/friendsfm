<script lang="ts">
  import { goto } from '$app/navigation';
  import { session } from '$lib/session';
  import { scale } from 'svelte/transition';
  //todo: implement the music platform search page
</script>

<div
  in:scale={{
    duration: 200,
  }}
  class="h-full bg-gray-900"
>
  <div class="sticky top-0 w-full mx-auto p-2">
    <button on:click={() => {}} class="absolute left-3 top-3 text-transparent">
      <svg
        class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-blue-500`}
        fill="currentColor"
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M216,112v96a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112A16,16,0,0,1,56,96H80a8,8,0,0,1,0,16H56v96H200V112H176a8,8,0,0,1,0-16h24A16,16,0,0,1,216,112ZM93.66,69.66,120,43.31V136a8,8,0,0,0,16,0V43.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,69.66Z"
        ></path>
      </svg>
    </button>
    <button
      on:click={() => goto('/main/profile')}
      class="absolute right-3 top-3 text-transparent"
      ><svg
        class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-${$session.user.public.musicPlatform}`}
        fill="none"
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
        ></path>
      </svg>
    </button>
  </div>
</div>
