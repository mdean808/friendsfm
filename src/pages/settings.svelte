<script>
  import { Dialog } from '@capacitor/dialog';
  import Button from '../components/Button.svelte';
  import { getPlatformColor, goto } from '../lib';

  import {
    loading,
    user,
    logout,
    prevPath,
    unlinkMusicProvider,
  } from '../store';
</script>

<div>
  <div
    class="w-full flex border-b-white border-b-2 flex-row justify-between items-center h-[55px] px-2"
  >
    <div class="flex-grow-0 text-transparent">
      <svg
        class="w-8 h-8"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
        /></svg
      >
    </div>
    <h1 class="text-center pt-2 mx-auto text-2xl text-white flex-grow">
      settings
    </h1>
    <button on:click={() => goto($prevPath)} class="flex-grow-0">
      <svg
        class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-${getPlatformColor(
          $user.musicPlatform
        )} `}
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
          d="M8.25 4.5l7.5 7.5-7.5 7.5"
        />
      </svg>
    </button>
  </div>
  <div class="mx-auto w-full text-center py-2 px-2">
    <Button
      className="mt-2 mx-auto"
      type="primary"
      title="reset"
      on:click={async () => {
        goto('/username');
      }}>change username</Button
    >
    <br />
    <Button
      className="mt-2 mx-auto"
      type="primary"
      title="reset"
      on:click={async () => {
        const confirm = await Dialog.confirm({
          title: 'Unlink Music Provider',
          message:
            'Are you sure? You will have to re-link a music provider again.',
        });
        if (!confirm.value) return;
        loading.set(true);
        await unlinkMusicProvider();
        loading.set(false);
        goto('/music_provider');
      }}>unlink music provider</Button
    >
    <br />
    <Button
      className="mt-2 mx-auto"
      type="breaking"
      title="reset"
      on:click={async () => {
        goto('/new_user');
        await logout();
      }}>log out</Button
    >
  </div>
</div>
