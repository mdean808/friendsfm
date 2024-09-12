<script lang="ts">
  import type { Writable } from 'svelte/store';

  export let loading = false;
  export let rounded = true;
  export let tabs: {
    name: string;
    id: string;
    component: ConstructorOfATypedSvelteComponent;
    props?: object;
  }[] = [];
  export let activeTab: Writable<string>;
</script>

<div
  class={`grid grid-cols-2 bg-gray-900 ${rounded ? 'rounded-lg' : ''} `}
>
  {#each tabs as tab, i}
    <div>
      <input
        type="radio"
        name="provider"
        id={tab.id}
        value={tab.id}
        bind:group={$activeTab}
        class="peer hidden"
        checked={$activeTab === tab.id}
      />
      <label
        for={tab.id}
        class={`w-full flex cursor-pointer select-none p-2 text-center focus:outline-none outline-none peer-checked:bg-blue-500 peer-checked:text-white
                ${i === 0 && (rounded ? 'rounded-l-lg' : '')}
                ${i === tabs.length - 1 && (rounded ? 'rounded-r-lg' : '')}
                ${loading && 'animate-pulse'}
              `}
      >
        <div class="mx-auto">
          {#if loading}
            <p class="h-5 mb-1 mx-auto rounded-md bg-gray-600 w-32" />
          {:else}
            {tab.name}
          {/if}
        </div>
      </label>
    </div>
  {/each}
</div>
{#each tabs as tab}
  {#if tab.id === $activeTab}
    <div>
      <svelte:component this={tab.component} {...tab.props} />
    </div>
  {/if}
{/each}
