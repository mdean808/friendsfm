<script lang="ts">
  export let tabs: {
    name: string;
    id: string;
    component: ConstructorOfATypedSvelteComponent;
    props?: object;
  }[] = [];
  export let activeTab: any;
</script>

<div class="grid grid-cols-2 rounded-b-xl bg-gray-900">
  {#each tabs as tab, i}
    <div>
      <input
        type="radio"
        name="provider"
        id={tab.id}
        value={tab.id}
        bind:group={activeTab}
        class="peer hidden"
        checked
      />
      <label
        for={tab.id}
        class={`w-full flex cursor-pointer select-none ${
          i === 0 && 'rounded-bl-xl'
        } ${
          i === tabs.length - 1 && 'rounded-br-xl'
        } p-2 text-center outline:none peer-checked:bg-blue-500 peer-checked:font-bold peer-checked:text-white`}
        ><div class="mx-auto">
          {tab.name}
        </div>
      </label>
    </div>
  {/each}
</div>
{#each tabs as tab}
  {#if tab.id === activeTab}
    <svelte:component this={tab.component} {...tab.props} />
  {/if}
{/each}
