<script lang="ts">
  import { slide } from 'svelte/transition';
  import LoadingIndicator from '../LoadingIndicator.svelte';
  import { onMount } from 'svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import { sendFriendRequest, getFriendSuggestions } from '../../store';

  let suggestions: {
    username: string;
    mutual: string;
    loading: boolean;
  }[] = [];
  let loading = true;

  onMount(async () => {
    const res = await getFriendSuggestions();
    if (res) {
      suggestions = res.map((u) => {
        return { username: u.username, mutual: u.mutual, loading: false };
      });
    }
    loading = false;
  });

  const addFriend = async (suggestion: {
    username: string;
    loading: boolean;
  }) => {
    if (suggestion.loading) return;
    suggestion.loading = true;
    if (await sendFriendRequest(suggestion.username.trim())) {
      toast.push('Succcessfully sent friend request');
    }
    suggestion.loading = false;
  };
</script>

<div
  class="bg-gray-800 border-t-2 border-white max-h-[50vh] h-auto overflow-scroll"
>
  {#if loading}
    <div transition:slide class="w-full flex justify-between py-4 px-3">
      <LoadingIndicator className="w-8 mx-auto" />
    </div>
  {:else}
    {#each suggestions as suggestion}
      <div
        transition:slide
        class="w-full border-b-white border-b-2 flex justify-between py-3 px-3"
      >
        <div class="flex flex-row gap-2">
          <img
            class="w-7 h-7 rounded-full mx-auto self-center"
            alt="User Avatar"
            src={`https://icotar.com/avatar/${suggestion.username}.svg`}
          />
          <div class="">
            <span class="text-white block">{suggestion.username}</span>
            <span class="text-gray-400 text-sm block"
              >mutual friend: {suggestion.mutual}</span
            >
          </div>
        </div>
        <div class="self-center">
          {#if suggestion.loading}
            <LoadingIndicator className="w-6 mx-auto" />
          {:else}
            <svg
              fill="none"
              class="w-6 h-6 mx-auto"
              on:click={(e) => {
                e.stopPropagation();
                addFriend(suggestion);
              }}
              on:keypress={(e) => {
                e.stopPropagation();
                addFriend(suggestion);
              }}
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>
