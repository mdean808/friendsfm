<script lang="ts">
  import type { WritableAtom } from 'nanostores';
  import { fade } from 'svelte/transition';

  export let tabs: {
    name: string;
    id: string;
    component: ConstructorOfATypedSvelteComponent;
    props?: object;
  }[] = [];
  export let activeTab: WritableAtom<string>;
</script>

<div class="grid grid-cols-2 bg-gray-900">
  {#each tabs as tab}
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
        class={`w-full flex cursor-pointer select-none border-b-white border-b-2 p-2 text-center outline:none peer-checked:bg-blue-500 peer-checked:text-white`}
        ><div class="mx-auto">
          {tab.name}
        </div>
      </label>
    </div>
  {/each}
</div>
{#each tabs as tab}
  {#if tab.id === $activeTab}
    <div transition:fade={{ duration: 150 }}>
      <svelte:component this={tab.component} {...tab.props} />
    </div>
  {/if}
{/each}
