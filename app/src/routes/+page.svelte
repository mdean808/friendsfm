<script lang="ts">
  import { initParams } from '$lib/util';
  import Icon from '$assets/icon.png';
  import LoadingIndicator from '$components/LoadingIndicator.svelte';
  import { onMount } from 'svelte';
  onMount(async () => {
    if (window.location.search)
      initParams.set(new URLSearchParams(window.location.search));
  });
</script>

<div class="z-40 fixed top-0 left-0 bg-gray-800 w-full h-full flex">
  <div class="self-center mx-auto items-center justify-center">
    <img src={Icon} alt="FriendsFM Logo" class="mx-auto mt-16 w-56 h-56" />
    <LoadingIndicator className="w-16 h-16 mx-auto" />
  </div>
</div>
