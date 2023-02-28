<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let name: string;
  export let placeholder: string;
  export let value = '';
  export let className: string = '';
</script>

<input
  {name}
  {placeholder}
  bind:value
  on:input={() => dispatch('input')}
  type="text"
  class={`border-2 border-gray-600 hover:border-gray-400 focus:border-gray-400 w-full outline-none bg-gray-900 px-4 py-2 rounded-sm text-white placeholder:text-gray-400 ${className}`}
/>
