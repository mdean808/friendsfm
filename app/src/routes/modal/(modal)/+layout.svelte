<script lang="ts">
  import { scale } from 'svelte/transition';
</script>

<div
  in:scale={{
    duration: 200,
  }}
  class="h-full bg-gray-800"
>
  <div class="sticky top-0 w-full mx-auto">
    <div
      class="text-white mx-auto text-center"
      style="height: calc(100% - 70px); overflow-y: scroll;"
    >
      <slot />
    </div>
  </div>
</div>
