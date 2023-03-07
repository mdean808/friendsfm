<script lang="ts">
  import { toast } from '@zerodevx/svelte-toast';
  import Button from '../components/Button.svelte';
  import Input from '../components/Input.svelte';
  import { goto } from '../lib';

  import { updateUsername, loading, user } from '../store';

  let username: string;
  const setUsername = async () => {
    if (!username) return;
    if (username.includes(' '))
      return toast.push('Your username may not have spaces.');
    username = username.toLowerCase();
    loading.set(true);
    if (await updateUsername(username)) {
      if (!user.get().musicPlatform) goto('/music_provider');
      else goto('/');
    }
    loading.set(false);
  };
</script>

<main class="text-center mx-auto w-full">
  <div class="mx-auto py-6 px-4 w-full">
    <h1 class="text-4xl">
      {#if $user.username && $user.username !== $user.id}
        change username
      {:else}
        username
      {/if}
    </h1>
    <p class="text-lg text-gray-400">your friends will find you @{username}</p>
    <div class="mt-20">
      <Input placeholder="username" name="username" bind:value={username} />
    </div>
    <div class="w-full mt-8">
      <Button
        type="submit"
        className={`${
          username ? '' : 'bg-gray-600 hover:bg-gray-600 cursor-default'
        } mx-auto px-6`}
        title="Finish Up"
        on:click={setUsername}>next</Button
      >
    </div>
    <button
      on:click={() => goto('/new_user')}
      class="mx-auto text-blue-500 underline text-center mt-10">go back</button
    >
  </div>
</main>
