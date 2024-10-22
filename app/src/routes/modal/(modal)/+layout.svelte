<script lang="ts">
  import { page } from '$app/stores';
  import { scale } from 'svelte/transition';
</script>

<div
  in:scale={{
    duration: 200,
  }}
  class={`h-full ${$page.route.id?.includes('submission') ? 'bg-gray-700' : 'bg-gray-800'}`}
>
  <div class="sticky top-0 w-full mx-auto">
    <div
      class="text-white mx-auto text-center overflow-y-scroll"
      style="height: calc(100% - 60px); max-height: 100dvh;"
    >
      <slot />
    </div>
  </div>
</div>
