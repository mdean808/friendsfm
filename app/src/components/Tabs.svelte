<script lang="ts">
  import type { WritableAtom } from 'nanostores';

  export let loading = false;
  export let tabs: {
    name: string;
    id: string;
    component: ConstructorOfATypedSvelteComponent;
    props?: object;
  }[] = [];
  export let activeTab: WritableAtom<string>;
</script>

<div class="grid grid-cols-2 bg-gray-900 rounded-t-lg border-b-2 border-white">
  {#each tabs as tab, i}
    <div>
      <input
        type="radio"
        name="provider"
        id={tab.id}
        value={tab.id}
        bind:group={$activeTab}
        class="peer hidden"
        checked
      />
      <label
        for={tab.id}
        class={`w-full flex cursor-pointer select-none p-2 text-center focus:outline-none outline-none peer-checked:bg-blue-500 peer-checked:text-white
                ${i === 0 && 'rounded-tl-lg'}
                ${i === tabs.length - 1 && 'rounded-tr-lg'}
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
