<script>
  import { goto } from '$app/navigation';
  import Button from '$components/Button.svelte';
  import { endSession, session } from '$lib/session';
  import { loading, network, showToast } from '$lib/util';
  import { FirebaseFirestore } from '@capacitor-firebase/firestore';
  import { Dialog } from '@capacitor/dialog';
  import { fly } from 'svelte/transition';

  const deleteAccount = async () => {
    const { value } = await Dialog.confirm({
      title: 'Delete your FriendsFM Account.',
      message: `Are you sure? Your data will not save if you try logging in again.`,
    });
    if (!value) return;
    loading.set(true);
    await network.queryFirebase('deleteuser');
    await goto('/intro/login');
    await endSession();
    loading.set(false);
    showToast({ content: 'successfully deleted your account.' });
  };
</script>

<div
  in:fly={{
    duration: 200,
    x: -document.body.clientWidth,
  }}
>
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
    <button on:click={() => goto('/main/profile')} class="flex-grow-0">
      <svg
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
  <div class="mx-4 flex h-full space-y-4 mt-4 flex-col">
    <Button
      type="primary"
      title="reset"
      on:click={async () => {
        goto('/intro/username');
      }}>change username</Button
    >
    <Button
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
        await FirebaseFirestore.updateDocument({
          reference: `users/${$session.user.id}`,
          data: { musicPlatform: null, musicPlatformAuth: null },
        });
        await FirebaseFirestore.updateDocument({
          reference: `users/${$session.user.id}/public/info`,
          data: { musicPlatform: null },
        });
        $session.user.public.musicPlatform = undefined;
        loading.set(false);
        goto('/intro/music-platform');
      }}>unlink music provider</Button
    >
    <Button
      type="breaking"
      title="reset"
      on:click={async () => {
        await goto('/intro/login');
        await endSession();
        showToast({ content: 'successfully logged out.' });
      }}>log out</Button
    >
    <div class="pt-24">
      <button
        on:click={deleteAccount}
        class="text-sm mx-auto w-full text-blue-500 underline text-center mt-auto py-2 px-2"
      >
        remove your data and delete your account</button
      >
    </div>
  </div>
</div>
