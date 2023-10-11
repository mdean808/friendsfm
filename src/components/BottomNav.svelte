<script>
  import { getPlatformColor, goto } from '../lib';
  import { currPath, user } from '../store';
</script>

<div class={`flex w-full fixed`}>
  <button
    on:click={() => goto('/songs')}
    class="w-1/3 flex justify-center py-2"
  >
    <div
      class={`mx-auto rounded-full border bg-gray-900 px-6 pt-1 ${
        $currPath === '/songs'
          ? `border-${getPlatformColor($user.musicPlatform)} `
          : 'currentColor border-transparent'
      }`}
    >
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
    <div
      class={`mx-auto rounded-full border bg-gray-900 px-6 pt-1 ${
        $currPath === '/'
          ? `border-${getPlatformColor($user.musicPlatform)} `
          : 'currentColor border-transparent'
      }`}
    >
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
    on:click={() => goto('/profile')}
    class="w-1/3 flex justify-center py-2"
  >
    <div
      class={`mx-auto rounded-full border bg-gray-900 px-6 pt-1 ${
        $currPath === '/profile'
          ? `border-${getPlatformColor($user.musicPlatform)} `
          : 'currentColor border-transparent'
      }`}
    >
      <svg
        class={`w-6 h-6 mx-auto ${
          $currPath === '/profile'
            ? `text-${getPlatformColor($user.musicPlatform)}`
            : 'currentColor'
        }`}
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
          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
        ></path>
      </svg>
      <span class="text-white">profile</span>
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
