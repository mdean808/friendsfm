<script lang="ts">
  import { getPlatformColor, goto } from '../lib';
  import { prevPath, user } from '../store';
</script>

<div>
  <div
    class="w-full flex border-b-white border-b-2 flex-row justify-between items-center h-[55px] px-2"
  >
    <button on:click={() => goto($prevPath)} class="flex-grow-0">
      <svg
        fill="none"
        class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-${getPlatformColor(
          $user.musicPlatform
        )} `}
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 19.5L8.25 12l7.5-7.5"
        ></path>
      </svg>
    </button>
    <h1 class="text-center pt-2 mx-auto text-2xl text-white flex-grow">
      about
    </h1>
    <div class="flex-grow-0 text-transparent">
      <svg
        fill="none"
        class="w-8 h-8"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 19.5L8.25 12l7.5-7.5"
        ></path>
      </svg>
    </div>
  </div>
  <div class="mx-auto w-full py-2 px-2">
    <div class="py-4 text-left">
      <p>
        FriendsFM is a music-sharing application that sends a daily notification
        at a random time, encouraging each user to share their current listening
        preferences.
      </p>
      <p>
        The aim is to facilitate the exchange of musical interests among
        friends, fostering a continuous sharing of top tunes.
      </p>
    </div>
    <p class="text-left text-gray-400">created by morgan dean</p>
    <div class="py-6 text-blue-600 text-left">
      <a target="_blank" href="https://friendsfm.mogdan.xyz/privacy"
        >privacy policy</a
      >
    </div>
  </div>
</div>
