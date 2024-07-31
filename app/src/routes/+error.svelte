<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Button from '$components/Button.svelte';
</script>

<div class="text-center text-white w-full mx-auto py-10">
  <h1 class="text-2xl">Something Went Wrong!</h1>
  <p class="text-gray-400 text-sm">Error: {$page.error?.message}</p>
  <div class="py-2 mt-5 px-4">
    <p>press the button below to go back</p>
    <Button type="primary" title="go back" on:click={() => goto('/main/home')}
      >go back</Button
    >
  </div>
</div>
