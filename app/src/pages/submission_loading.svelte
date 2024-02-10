<script lang="ts">
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import { insets } from '../store';
</script>

<div
  style={`padding-top: ${0 + $insets.top}px`}
  class="z-40 fixed top-0 left-0 w-full h-full bg-gray-800"
>
  <div class="sticky top-0 w-full mx-auto">
    <div
      class={`w-full flex bg-gray-900 flex-row rounded-t-lg justify-between items-center h-[55px] p-2`}
    >
      <button class="flex-grow-0 text-transparent w-8 h-8 p-1"></button>
      <span
        class="text-center pt-2 mx-auto text-2xl bg-gray-700 rounded-md animate-pulse w-32 h-6 text-white"
      ></span>
      <button class="flex-grow-0 text-transparent w-8 h-8 p-1">
        <!--
        //todo: add option to cancel the submission loading

        <svg
          class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-white`}
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
        </svg>-->
      </button>
    </div>
  </div>
  <div class="bg-gray-800 py-2 px-4 pb-[50px] w-full">
    <div>
      <span
        class="text-sm text-center mx-auto block text-red-500 animate-pulse rounded h-4 w-20 bg-gray-700"
      >
      </span>
      <div class="pt-2">
        <div
          class="flex mx-auto w-24 h-24 bg-gray-700 rounded-md animate-pulse"
        ></div>
        <div class="w-full mx-auto text-center py-2">
          <div class="flex flex-col px-3 justify-start">
            <span
              class={`truncate mx-auto text-white animate-pulse mb-2 rounded-md h-6 w-52 bg-gray-700`}
            >
            </span>
          </div>
        </div>
        <div class="pt-2">
          <div
            class="text-xs mx-auto items-center leading-sm
        uppercase px-3 pb-1 pt-1.5 rounded-full animate-pulse bg-gray-700 w-16 h-7"
          ></div>
        </div>
      </div>
      <div class="mt-2 border-t-white border-t-2">
        <div class="w-16 mx-auto gap-4 mt-7">
          <LoadingIndicator />
        </div>
        <p class="text-center mx-auto w-full mt-1">loading submission...</p>
      </div>
    </div>
  </div>
</div>
