<script lang="ts">
  import { slide } from 'svelte/transition';
  import LoadingIndicator from '../LoadingIndicator.svelte';
  import { onMount } from 'svelte';
  import {
    sendFriendRequest,
    getFriendSuggestions,
    publicProfileUsername,
  } from '../../store';
  import { goto, showToast } from '../../lib/util';

  let suggestions: {
    username: string;
    mutual: string;
    loading: boolean;
    sent: boolean;
  }[] = [];
  let loading = true;

  onMount(async () => {
    const res = await getFriendSuggestions();
    if (res) {
      suggestions = res.map((u) => {
        return {
          username: u.username,
          mutual: u.mutual,
          loading: false,
          sent: false,
        };
      });
    }
    loading = false;
  });

  const addFriend = async (
    suggestion: {
      username: string;
      mutual: string;
      loading: boolean;
    },
    sIndex: number
  ) => {
    if (suggestion.loading) return;
    suggestions[sIndex].loading = true;
    suggestions = [...suggestions];
    if (await sendFriendRequest(suggestion.username.trim())) {
      showToast({ content: 'Successfully sent friend request' });
      suggestions[sIndex].loading = false;
      suggestions[sIndex].sent = true;
      suggestions = [...suggestions];
    } else {
      suggestions[sIndex].loading = false;
      suggestions = [...suggestions];
    }
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
    {#each suggestions as suggestion, i}
      <div
        transition:slide
        class="w-full border-b-white border-b-2 flex justify-between py-3 px-3"
      >
        <button
          on:keypress={() => {
            publicProfileUsername.set(suggestion.username);
            goto('/public_profile');
          }}
          on:click={() => {
            publicProfileUsername.set(suggestion.username);
            goto('/public_profile');
          }}
          class="flex flex-row gap-2"
        >
          <img
            class="w-7 h-7 rounded-full mx-auto self-center"
            alt="User Avatar"
            src={`https://icotar.com/avatar/${suggestion.username}.svg`}
          />
          <div class="text-left">
            <span class="text-white block">{suggestion.username}</span>
            <span class="text-gray-400 text-sm block"
              >mutual friend: {suggestion.mutual}</span
            >
          </div>
        </button>
        <div class="self-center">
          {#if suggestion.loading}
            <LoadingIndicator className="w-6 mx-auto" />
          {:else if suggestion.sent}
            <svg
              data-slot="icon"
              fill="none"
              stroke-width="1.5"
              class="w-6 h-6 mx-auto"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              ></path>
            </svg>
          {:else}
            <svg
              fill="none"
              class="w-6 h-6 mx-auto"
              on:click={(e) => {
                e.stopPropagation();
                addFriend(suggestion, i);
              }}
              on:keypress={(e) => {
                e.stopPropagation();
                addFriend(suggestion, i);
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
    <div class="pt-1">
      <p class="text-center w-full mx-auto text-gray-400">
        no more suggestions.
      </p>
    </div>
  {/if}
</div>
