<script lang="ts">
  import Button from "../components/Button.svelte";
  import Input from "../components/Input.svelte";
  import { goto } from "../lib";

  import { updateUsername, loading } from "../store";

  let username: string;
  const setUsername = async () => {
    if (!username) return;
    //TODO: show loading indicator
    loading.set(true)
    if (await updateUsername(username)) goto("/music_provider");
    loading.set(false)
  };
</script>

  <main class="text-center mx-auto w-full">
    <div class="mx-auto py-6 px-4 w-full">
      <h1 class="text-4xl">Username</h1>
      <p class="text-lg text-gray-400">Your friends will find you @{username}</p>
      <div class="mt-20">
        <Input placeholder="johndoe20" name="username" bind:value={username} />
      </div>
      <div class="w-full mt-8">
        <Button
          type="submit"
          className={`${
            username ? "" : "bg-gray-600 hover:bg-gray-600 cursor-default"
          } mx-auto px-6`}
          title="Finish Up"
          on:click={setUsername}>Next</Button
        >
      </div>
    </div>
  </main>
