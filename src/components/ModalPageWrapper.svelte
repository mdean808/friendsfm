<script lang="ts">
  import { fly, type FlyParams } from 'svelte/transition';
  import { insets } from '../store';

  export let flySettings: FlyParams;
</script>

<div
  style={`padding-top: ${0 + $insets.top}px`}
  class="z-40 bg-gray-900 absolute left-0 top-0 w-full h-full"
  transition:fly={flySettings}
>
  <slot />
</div>
