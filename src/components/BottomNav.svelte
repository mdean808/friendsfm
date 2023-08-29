<script>
  import { getPlatformColor, goto } from '../lib';
  import { bottomInset, currPath, user } from '../store';
</script>

<div
  style={`height: ${70 + $bottomInset + (bottomInset ? -15 : 0)}px`}
  class={`bg-gray-900 z-30 flex w-full`}
>
  <button
    on:click={() => goto('/songs')}
    class="w-1/3 flex justify-center py-2"
  >
    <div class="mx-auto">
      <svg
        class={`w-6 h-6 mx-auto ${
          $currPath === '/songs'
            ? `text-${getPlatformColor($user.musicPlatform)}`
            : 'currentColor'
        }`}
        fill={'currentColor'}
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
        /></svg
      >
      <span class="text-white">songs</span>
    </div>
  </button>
  <button on:click={() => goto('/')} class="w-1/3 flex justify-center py-2">
    <div class="mx-auto">
      <svg
        class={`w-6 h-6 mx-auto ${
          $currPath === '/'
            ? `text-${getPlatformColor($user.musicPlatform)}`
            : 'currentColor'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
        /></svg
      >
      <span class="text-white">home</span>
    </div>
  </button>
  <button
    on:click={() => goto('/stats')}
    class="w-1/3 flex justify-center py-2"
  >
    <div class="mx-auto">
      <svg
        fill="none"
        class={`w-6 h-6 mx-auto ${
          $currPath === '/stats'
            ? `text-${getPlatformColor($user.musicPlatform)}`
            : 'currentColor'
        }`}
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        ></path>
      </svg>
      <span class="text-white">stats</span>
    </div>
  </button>
  <!--  <button
    on:click={() => goto('/audial')}
    class="w-1/3 flex justify-center py-2"
  >
    <div class="mx-auto">
      <svg
        class={`w-6 h-6 mx-auto ${
          $currPath === '/audial'
            ? `text-${getPlatformColor($user.musicPlatform)}`
            : 'currentColor'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
          clip-rule="evenodd"
        /></svg
      >
      <span class="text-white">audial</span>
    </div>
  </button> -->
</div>
